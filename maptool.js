(function () {
    let parts = window.location.href.split("/")
    let playerIDIndex = parts.indexOf("players") + 1;
    let playerID = parts[playerIDIndex];
    let recordsURL = location.protocol + "//" + location.hostname + "/kzstats/api/player/" + playerID + '/records/';
    $('head').append('<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js">');
    $('head').append('<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css">')

    $('table').hide();
    $('.pagination').hide();
    $('.recordstext').hide();
    $('.col-md-12').append(`<div class="table-container" style="float:left !important; overflow: hidden; height: 800px; width: 800px; ">
<div style="float:left; width: 100%; color: white; text-align:left; font-size:1.2em"><span>click to sort, ctrl/cmd+click to multi-sort, type ":" in the time filter for finished maps and "/" for unfinished</span></div>
<div class="handsontable col-md-12" style="margin:1" id="my-table">TABLE</div></div>`);
    $tableContainer = $('#my-table')[0];
    function getTimeFromSeconds(seconds) {
        var hours = Math.floor(seconds / 3600);
        if (hours < 10)
            hours = "0" + hours;
        seconds -= hours * 3600;
        var min = Math.floor(seconds / 60);
        if (min < 10)
            min = "0" + min;
        seconds -= min * 60;
        seconds = seconds.toFixed(2);
        if (seconds < 10)
            seconds = "0" + seconds
        return hours + ":" + min + ":" + seconds;
    }
    $.getJSON(recordsURL, function (data) {
        let records = [];
        let headers = ["Map", "TP Time", "TP's", "Pro Time"];
        $.each(data, function (i, record) {
            let emptytime = x => x === "-1" ? "n/a" : getTimeFromSeconds(x);
            let emptytp = x => x === "-1" ? "n/a" : x;
            records.push([record["mapname"], emptytime(record["runtime"]), emptytp(record["teleports"]), emptytime(record["runtimepro"])]);
        })
        var debounceFn = Handsontable.helper.debounce(function (colIndex, event) {
            var filtersPlugin = mytable.getPlugin('filters');
            filtersPlugin.removeConditions(colIndex);
            filtersPlugin.addCondition(colIndex, 'contains', [event.realTarget.value]);
            filtersPlugin.filter();
        }, 200);
        var addEventListeners = function (input, colIndex) {
            input.addEventListener('keydown', function (event) {
                debounceFn(colIndex, event);
            });
        };
        var getInitializedElements = function (colIndex) {
            var div = document.createElement('div');
            var input = document.createElement('input');
            div.className = 'filterHeader';
            addEventListeners(input, colIndex);
            div.appendChild(input);
            return div;
        };
        var addInput = function (col, TH) {
            if (typeof col !== 'number') {
                return col;
            }
            if (col >= 0 && TH.childElementCount < 2) {
                TH.appendChild(getInitializedElements(col));
            }
        };
        var doNotSelectColumn = function (event, coords) {
            if (coords.row === -1 && event.realTarget.nodeName === 'INPUT') {
                event.stopImmediatePropagation();
                this.deselectCell();
            }
        };
        var mytable = new Handsontable($tableContainer, {
            data: records,
            colHeaders: headers,
            multiColumnSorting: true,
            className: 'type-filter',
            filters: true,
            colWidths: 200,
            afterGetColHeader: addInput,
            beforeOnCellMouseDown: doNotSelectColumn,
            licenseKey: 'non-commercial-and-evaluation'
        });
    })
})();
