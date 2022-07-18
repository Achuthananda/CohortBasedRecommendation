import { httpRequest } from 'http-request';
import { logger } from 'log';
import URLSearchParams from 'url-search-params';
import { createResponse } from 'create-response';


async function getJSON (url) {
	const response = await httpRequest(`${url}`);
	if (response.ok) {
	  return await response.json();
	} else {
	  return { error: `Failed to return ${url}` };
	}
}

export async function onClientRequest(request) {

	const params = new URLSearchParams(request.query);
	const userId = params.get('userId');

	logger.log("user Id is %s",userId);

    const response_config = await httpRequest(`https://cohort.achuth.tech/getcohort?userId=${userId}`,{
        method: "GET",
        timeout: 1000
    });
    if (response_config.ok) {
        const jsonObj = await response_config.json();
        const cohortId = jsonObj['cohortId'];
		logger.log('Fetched a cohort Id:%d',cohortId);
		request.setVariable('PMUSER_COHORTD',cohortId);

    } else {
        logger.log("Failed to get the cohort Id");
    }
}

export async function responseProvider(request) {
	logger.log("In ResponseProvider now");
	let result = {};
	
	let cohortId = request.getVariable('PMUSER_COHORTD');
	const recommendationEP = `https://demoserver.achuth.tech/getrecommendation?cohortId=${cohortId}`;

	const endPointResult1 = getJSON(recommendationEP).then(json => { result = json; });
	logger.log(endPointResult1);
	
	// Wait for all requests to complete.
	await Promise.all([endPointResult1]);
	let jsonresult = JSON.stringify(result, null,2);
  
	// Return merged JSON as the response.
	return Promise.resolve(createResponse(
	  200,
	  { 'Content-Type': ['application/json'] },
	  jsonresult
	));
}


export function onClientResponse(request, response) {
	// Outputs a message to the X-Akamai-EdgeWorker-onClientResponse-Log header.
	logger.log('Adding a header in ClientResponse');
	response.setHeader('Serverless', "Edgeworker");
}