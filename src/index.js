/**
 * @typedef Context
 * @property {Number} index
 * @property {String} text
 */

class Table {
    /**
     * @param {string} tableId <table> element id
     * @param {string?} searchId Search <input> element id (null for disable search)
     * @param {function?} callback
     */
    constructor(tableId, searchId, callback) {
        /** @type {HTMLTableElement} */
        this.table = document.getElementById(tableId)

        /** @type {HTMLTableRowElement[]} */
        this.trArray = []

        this.callback = callback

        if (searchId == null) {
            this.searchDisabled = true
        } else {
            document.getElementById(searchId).addEventListener("input", (event) => {
                this.search(event.currentTarget.value)
            })
        }

        this._createIndex()
        this._createStyle()
        this?.callback()
    }

    /**
     * Create `<style>` element for `<thead>` arrow
     */
    _createStyle() {
        document.querySelector("head").innerHTML += `<style>
            .tb-desc:after {
                content: " ↓";
            }
            .tb-asc:after {
                content: " ↑";
            }
            .tb-filtered {
                display: none;
            }
        </style>`
    }

    _createIndex() {
        let indexCtx = 1
        this.table
            .querySelector("thead")
            .querySelector("tr")
            .querySelectorAll("th")
            .forEach((th) => {
                th.dataset.index = indexCtx++
                th.dataset.orderBy = "desc"
                th.dataset.className = th.className

                th.addEventListener("click", (event) => {
                    this.sort(event.currentTarget.dataset.index, event.currentTarget.dataset.orderBy)
                })
            })

        let trIndex = 0

        this.table
            .querySelector("tbody")
            .querySelectorAll("tr")
            .forEach((tr) => {
                tr.dataset.index = trIndex++
                this.trArray.push(tr)

                // 검색용 문자열 설정
                let search = []

                tr.querySelectorAll("td").forEach((td) => {
                    search.push(td.innerText.trim().toLowerCase())
                })

                tr.dataset.search = JSON.stringify(search)
            })
    }

    _resetColumnArrow() {
        this.table
            .querySelector("thead")
            .querySelector("tr")
            .querySelectorAll("th")
            .forEach((th) => {
                th.className = th.dataset.className
            })
    }

    /**
     * @param {string} filter
     */
    search(filter) {
        if (filter == null) {
            return
        }

        filter = filter.trim().toLowerCase()

        this.table
            .querySelector("tbody")
            .querySelectorAll("tr")
            .forEach((tr) => {
                if (filter.length == 0) {
                    tr.classList.remove("tb-filtered")
                } else {
                    let parsedSearch = JSON.parse(tr.dataset.search)
                    tr.classList.add("tb-filtered")

                    for (let i = 0; i < parsedSearch.length; i++) {
                        if (parsedSearch[i].includes(filter)) {
                            tr.classList.remove("tb-filtered")
                            break
                        }
                    }
                }
            })

        this?.callback()
    }

    /**
     * @param {Number} index
     * @param {String} orderBy
     */
    sort(index, orderBy) {
        const column = this.table.querySelector("thead").querySelector("tr").querySelector(`th:nth-child(${index})`)

        // Toggle order by
        column.dataset.orderBy = orderBy == "desc" ? "asc" : "desc"

        // Set Arrow hint
        this._resetColumnArrow()
        column.className = (column.dataset.className + ` tb-${column.dataset.orderBy}`).trim()

        /** @type {Context[]} */
        let targets = []

        this.table
            .querySelector("tbody")
            .querySelectorAll("tr")
            .forEach((tr) => {
                targets.push({
                    index: tr.dataset.index,
                    text: tr.querySelector(`td:nth-child(${index})`).innerText.toLocaleLowerCase(),
                })
            })

        // Sort index
        targets = targets.sort((a, b) => {
            if (a.text == b.text) {
                return 0
            }

            if (orderBy == "asc") {
                // ASC
                if (a.text > b.text) {
                    return -1
                } else {
                    return 1
                }
            } else {
                // DESC
                if (a.text < b.text) {
                    return -1
                } else {
                    return 1
                }
            }
        })

        // Reset table
        this.table.querySelector("tbody").innerHTML = ""

        // Create row
        targets.forEach((target) => {
            const tr = this.trArray.filter((x) => x.dataset.index == target.index)[0]
            this.table.querySelector("tbody").appendChild(tr)
        })

        this?.callback()
    }
}
