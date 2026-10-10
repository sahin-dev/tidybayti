const fs = require('fs')
const path = require('path')

const searchGrocery  = async (query) => {

    const searchResult = new Map()

    const groceryList = JSON.parse(fs.readFileSync(path.join(__dirname,'data.json'),{encoding:'utf-8'}))

    const categoryList = Object.keys(groceryList)

    categoryList.forEach(category => {
        const items = groceryList[category]
        const categoryItem = []

        items.forEach(item => {
            if(item.toLowerCase().includes(query)){
                categoryItem.push(item)
            }
        })

        searchResult.set(category, categoryItem)
    })

    return groceryList
}

module.exports.groceryService  = {
    searchGrocery
}