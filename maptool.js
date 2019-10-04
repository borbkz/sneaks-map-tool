javascript: (function () {
    let parts = window.location.href.split("/");
    let playerIDIndex = parts.indexOf("players") + 1;
    let playerID = parts[playerIDIndex];
    let recordsURL = location.protocol + "//" + location.hostname + "/kzstats/api/player/" + playerID + '/records/';
    const MAPS_URL = 'https://kztimerglobal.com/api/v1.0/maps?is_validated=true&limit=1000';
    const SNEAK_MAPS_URL = 'https://snksrv.com/kzstats/api/map/';
    $('table-container').remove();
    $('.handsontable').remove();
    $('#tooltip').remove();
    $('table').remove();
    $('head').append('<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js">');
    $('head').append('<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css">');
    $('.pagination').hide();
    $('.recordstext').hide();
    $('.col-md-12').append('<div class="table-container" style="float:left !important; overflow: hidden; height: 800px; width: 1000px; ">' +
        '<div style="float:left; width: 1000px; color: white; text-align:center; font-size:1.2em; font-weight: bold">' +
        '<span id="tooltip">Click header to sort, ctrl/cmd+click to multi-sort, type ":" in the time filter for finished maps and "/" for unfinished</span></div>' +
        '<div class="handsontable col-md-12" style="margin:1" id="my-table">TABLE</div></div>');
    $tableContainer = $('#my-table')[0];
    function getTimeFromSeconds(seconds) {
        var hours = Math.floor(seconds / 3600);
        if (hours < 10) {
            hours = "0" + hours;
        }
        seconds -= hours * 3600;
        var min = Math.floor(seconds / 60);
        if (min < 10) {
            min = "0" + min;
        }
        seconds -= min * 60;
        seconds = seconds.toFixed(2);
        if (seconds < 10) {
            seconds = "0" + seconds
        }
        return hours + ":" + min + ":" + seconds;
    }
    $.getJSON(SNEAK_MAPS_URL, function (data) {
        let headers = ["Map", "Tier", "Pro Time", "TP Time", "TPs"];
        let sneakmaps = {};

        $.each(data, function (i, map) {
            sneakmaps[map["mapname"]] = Array(headers.length).fill("N/A");
            sneakmaps[map["mapname"]][headers.indexOf("Map")] = map["mapname"];
        });
        $.getJSON(recordsURL, function (data) {
            $.each(data, function (i, record) {
                let emptytime = x => x === "-1" ? "N/A" : getTimeFromSeconds(x);
                let emptytp = x => x === "-1" ? "N/A" : x;
                sneakmaps[record["mapname"]] = [record["mapname"], "", emptytime(record["runtimepro"]), emptytime(record["runtime"]), emptytp(record["teleports"])];
            });
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
                if (col >= 0 && col != headers.indexOf("TPs") && TH.childElementCount < 2) {
                    TH.appendChild(getInitializedElements(col));
                }
            };
            var doNotSelectColumn = function (event, coords) {
                if (coords.row === -1 && event.realTarget.nodeName === 'INPUT') {
                    event.stopImmediatePropagation();
                    this.deselectCell();
                }
            };
            mycolumns = Array(headers.length).fill({});
            mycolumns[headers.indexOf("TPs")] = { className: "htCenter" };
            mycolumns[headers.indexOf("Tier")] = { className: "htCenter" };
            mycolumns[headers.indexOf("Pro Time")] = { className: "htCenter" };
            mycolumns[headers.indexOf("TP Time")] = { className: "htCenter" };
            let records = Object.values(sneakmaps);
            var mytable = new Handsontable($tableContainer, {
                data: records,
                colHeaders: headers,
                multiColumnSorting: true,
                className: 'type-filter',
                columns: mycolumns,
                filters: true,
                colWidths: 200,
                afterGetColHeader: addInput,
                beforeOnCellMouseDown: doNotSelectColumn,
                licenseKey: 'non-commercial-and-evaluation'
            });
            $.getJSON(MAPS_URL, function (data) {
                let mapDict = {};
                let tierFinishes = Array(7).fill(0);
                let tierTotals = Array(7).fill(0);
                $.each(data, function (i, map) {
                    mapDict[map["name"]] = map["difficulty"];
                });
                for (let i = 0; i < records.length; i++) {
                    let curmap = records[i][0];
                    let tier = mapDict[curmap];
                    tierTotals[tier]++;
                    if (records[i][headers.indexOf("TP Time")] != "N/A") {
                        tierFinishes[tier]++;
                    }
                    records[i][headers.indexOf("Tier")] = tier || 0;
                }
                let tiers = ["Non-global", "Very Easy", "Easy", "Medium", "Hard", "Very Hard", "Death"];
                $('.runtext .ng-binding').css('display', 'inline');
                $('.progress').css('margin-bottom', '0');
                $('.playerinfo').hide();
                for (let i = 1; i < tiers.length; i++) {
                    let a = $('.progress:first').clone();
                    a.attr('id', 'tier-' + i + '-progress');
                    let percent = Math.floor(100 * (tierFinishes[i] / tierTotals[i]));
                    $('.runtext').append(tiers[i] + " TP Completion (" + percent + "%)");
                    $('.runtext').append(a);
                    console.log("tier " + i + " " + tierFinishes[i] + " maps out of " + tierTotals[i]);

                    $('#tier-' + i + '-progress .progress-bar').css('width', percent + '%');
                }
                mytable.updateSettings({
                });
            });
        });
    });
})();
