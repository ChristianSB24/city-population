const parseCSV = (csvData) => {  
    const rows = csvData.split('\n');
    const parsedData = [];
  
    for (let row of rows) {
      if (row.trim() === '') {
        continue;
      }
  
      const values = row.split(',');
      parsedData.push(values);
    }
  
    return parsedData;
  };

const convertCSVtoPopulationData = (data) => {
    const formattedData = {};

    for (entry of data) {
        // If any city includes a dash, space, quotes, or parenthesis it will be removed
        const city = entry[0].replace(/[-\s(),"']/g, '').toLowerCase();
        const state = entry[1].toLowerCase();
        const population = parseInt(entry[2]);

        if (!formattedData[state]) {
            formattedData[state] = {};
        }
        formattedData[state][city] = population;
    }
    return formattedData;
}

const convertPopulationDataToCSV = (populationData) => {
    const csvData = Object.entries(populationData).flatMap(([state, cities]) =>
        Object.entries(cities).map(([city, population]) => ({ city, state, population }))
    );
    return csvData.map(data => Object.values(data).map(value => {
        return value;
    }).join(',')).join('\n');
}

// const convertPopulationDataToCSV = (populationData) => {
//   const csvData = Object.entries(populationData).reduce((accumulator, [state, cities]) => {
//     return accumulator.concat(Object.entries(cities).map((entry) => {
//       return entry;
//     }));
//   }, []);

//   const csvLines = [];
//   for (let i = 0; i < csvData.length; i++) {
//     const [city, state, population] = csvData[i];
//     csvLines.push(`${city},${state},${population}`);
//   }

//   return csvLines.join('\n');
// };

  


module.exports = { parseCSV, convertCSVtoPopulationData, convertPopulationDataToCSV }