const csv = require('csv-parser')
const fs = require('fs')

const readData = function(fileName) {
    return new Promise((resolve) => {
        const results = []

        fs.createReadStream(fileName)
            .pipe(csv({ separator: ' ' }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    })
}

const parseData = function(data) {
    return {
        vertices: [...new Set(data.flatMap(row => [row.from, row.to]))],
        edges: data.map(({ distance, ...d }) => ({ distance: parseInt(distance), ...d }))
    }
}

const compute = function({ vertices, edges }, source) {
    const distances = Object.fromEntries(vertices.map(v => [v, v === source ? 0 : Infinity]))
    const predecessors = Object.fromEntries(vertices.map(v => [v, null]))

    const check = (from, to, distance) => {
        if (distances[from] + distance < distances[to]) {
            distances[to] = distances[from] + distance
            predecessors[to] = from
        }
    }

    for (vertex of vertices) {
        console.log('Iteration for vertex:', vertex)
        
        for ({ from, to, distance } of edges) {
            console.log(`Checking paths for edges: ${from}->${to} and ${to}->${from}`)

            check(from, to, distance)
            check(to, from, distance)
        }
    }

    return { distances, predecessors }
}

const getPaths = function(predecessors, source) {
    const getPath = vertex => predecessors[vertex] ? [vertex, ...getPath(predecessors[vertex])] : [source]

    return Object.fromEntries(Object.entries(predecessors).map(
        ([key, val]) => [key, getPath(val)]
    ))
}

const step = () => console.log(`\n${'-'.repeat(50)}\n`)

;(async function() {
    const SOURCE = 'F'

    console.log('Reading data')
    const rawData = await readData('cities.csv')
    console.log(rawData)

    step()

    const parsedData = parseData(rawData);
    console.log(parsedData)

    step()

    const result = compute(parsedData, SOURCE)
    console.log('\nPredecessors:')
    console.table(result.predecessors)
    console.log('\nOptimal values:')
    console.table(result.distances)

    step()

    const paths = getPaths(result.predecessors, SOURCE)
    console.log('Paths:')
    console.table(paths)
})()