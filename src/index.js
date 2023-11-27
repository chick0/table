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

        /** Number test regex */
        this.regex = /[0-9.,]*/

        /** Nullable Callback */
        this._callback = callback ?? null

        if (searchId == null) {
            this.searchDisabled = true
        } else {
            document.getElementById(searchId).addEventListener("input", (event) => {
                this.search(event.currentTarget.value)
            })
        }

        this._createStyle()
        this._createIndex()
        this.callback()
    }

    callback() {
        if (typeof this._callback == "function") {
            this._callback()
        }
    }

    /**
     * Create `<style>` element for `<thead>` arrow
     */
    _createStyle() {
        document.querySelector("head").innerHTML += `<style>
            .tb-table th {
                -moz-user-select: none;
                -webkit-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }

            .tb-table th:not(.tb-desc):not(.tb-asc):after {
                content: " 　";
            }

            .tb-desc:after {
                content: " ↓";
            }

            .tb-asc:after {
                content: " ↑";
            }

            .tb-filtered {
                display: none;
            }

            .tb-table th,
            .tb-table td {
                white-space: nowrap;
            }
        </style>`
    }

    _createIndex() {
        let indexCtx = 1
        this.table.classList.add("tb-table")

        this.table
            .querySelector("thead")
            .querySelector("tr")
            .querySelectorAll("th")
            .forEach((th) => {
                th.dataset.index = indexCtx++
                th.dataset.orderBy = "asc"

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
                th.classList.remove("tb-asc", "tb-desc")
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

        this.callback()
    }

    /**
     * @param {Number} index
     * @param {String} orderBy
     */
    sort(index, orderBy) {
        const column = this.table.querySelector("thead").querySelector("tr").querySelector(`th:nth-child(${index})`)

        // Update next orderBy option
        column.dataset.orderBy = orderBy == "desc" ? "asc" : "desc"

        // Set <th> arrow
        this._resetColumnArrow(index)
        column.classList.add(`tb-${orderBy}`)

        /** @type {Context[]} */
        let targets = []

        this.table
            .querySelector("tbody")
            .querySelectorAll("tr")
            .forEach((tr) => {
                let text = tr.querySelector(`td:nth-child(${index})`).innerText.toLocaleLowerCase().trim()

                let parsedNumber = this.regex.exec(text)[0].replace(",", "").trim()

                if (parsedNumber.length != 0) {
                    text = Number(parsedNumber)
                }

                targets.push({
                    index: tr.dataset.index,
                    text: text,
                })
            })

        // Sort index
        targets = targets.sort((a, b) => {
            if (a.text == b.text) {
                return 0
            }

            if (orderBy == "desc") {
                if (a.text > b.text) {
                    return -1
                } else {
                    return 1
                }
            } else if (orderBy == "asc") {
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

        this.callback()
    }
}
