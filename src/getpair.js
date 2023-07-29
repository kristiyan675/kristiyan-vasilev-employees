import isAfter from 'date-fns/isAfter'
import getOverlappingDaysInIntervals from 'date-fns/getOverlappingDaysInIntervals'

export function getOldestPair(event, setState) {
    let pairsProjectId = {};
    let csvOutput = event.target.result;
    // Sanitize input and convert to array
    // Input is expected to have the names of the columns, so we have the shift() else we get Invalid Date
    // After the split the last element is an empty string, so we have the pop()
    let data = csvOutput.split("\r\n");
    data.pop();
    data.shift();
    
    // Get Pairs with same Project Id that overlap in date range
    //Outer loop through all employees
    for (let i = 0; i < data.length - 1; i++) {
        let item = data[i];
        // split and trim inputs for whitespaces
        let [employeeId, projectId, dateFrom, dateTo] = item.split(',').map((item) => item.trim());
        dateFrom = new Date(dateFrom);
        dateTo === 'NULL' ? dateTo = new Date() : dateTo = new Date(dateTo)
        //For every iteration of an employee on the outer loop, do a nested loop through all employees to check for pairs
        for (let j = i + 1; j < data.length; j++) {
            let nestedItem = data[j];
            // split and trim inputs for whitespaces
            let [employeeIdNested, projectIdNested, dateFromNested, dateToNested] = nestedItem.split(',').map((item) => item.trim());
            dateFromNested = new Date(dateFromNested);
            dateToNested === 'NULL' ? dateToNested = new Date() : dateToNested = new Date(dateToNested);

            //Check if two employees have same projectId
            if (projectId === projectIdNested && employeeId !== employeeIdNested) {

            //  //Check if start and end dates for both employees are valid (startDate < endDate)
                if (isAfter(dateTo, dateFrom) && isAfter(dateToNested, dateFromNested)) {
                    // Calculates the days that overlap
                    let overlappingDaysCount =  getOverlappingDaysInIntervals(
                        { start: new Date(dateFrom), end: new Date(dateTo) },
                      { start: new Date(dateFromNested), end: new Date(dateToNested) }
                    )

                    if (overlappingDaysCount > 0){
                        let pairId = `${employeeId} - ${employeeIdNested}`
                        let reverseKey = `${employeeIdNested} - ${employeeId}`
                        if(pairsProjectId.hasOwnProperty(pairId)) {
                            pairsProjectId[pairId].timePaired += overlappingDaysCount
                            pairsProjectId[pairId].commonProjects.push({ [projectId]: overlappingDaysCount })
                        } else if(!(pairsProjectId.hasOwnProperty(reverseKey))) {
                            pairsProjectId[pairId] = {
                             timePaired: overlappingDaysCount,
                             commonProjects: [{ [projectId]: overlappingDaysCount }]
                            }
                        }
                    }
                }
            }
        }
    }

    let sorted = Object.entries(pairsProjectId).sort((a, b) => b[1].timePaired - a[1].timePaired)
    const longestPair = sorted[0]

    setState(longestPair)

}