var cal = null;
var total = null;
var cellSize = null;
var barChart = null;
var startDate = null;
var endDate = null;
var chartData = null;
var calendarData = null;

function getStartDate() {
    return new Date(new Date().getFullYear(), 0, 1);
}

function formatDate(date) {
    return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
}

function stringToDate(dateString) {
    dateString = dateString.split('/');
    let mm = parseInt(dateString[0]) - 1;
    let dd = parseInt(dateString[1]);
    let yyyy = parseInt(dateString[2]);
    return new Date(yyyy, mm, dd);
}

function dateToTimestamp(date) {
    return Math.round(date.getTime() / 1000);
}

function extractNumerical(value) {
    return parseFloat(value.substring(0, value.length - 2));
}

function getInnerDivWidth() {
    let width = $('.inner').width();
    let padding = extractNumerical($('.inner').css('padding'));
    return width - 2 * padding;
}

function getCellSize() {
    return (getInnerDivWidth() - 104) / 53; 
}

function getLegendScale(data) {
    let max_freq = 0;
    for (let timestamp in data) {
        max_freq = Math.max(max_freq, data[timestamp]);
    }

    if (max_freq < 5) {
        return [1, 2, 3, 4];
    }
    
    let scale = [];
    for (let i = 1; i < 5; i++) {
        scale.push(Math.round(i / 5 * max_freq));
    }
    return scale;
}

function getCalendarData() {
    total = 0;
    $.ajax({
        type: 'GET',
        url: '/calendar',
        dataType: 'json',
        success: function(res) {
            calendarData = res;
            for (let timestamp in res) {
                total += res[timestamp];
            }
            $('.heatmap-container .heatmap-title').html(`Completed ${total} Habits this Year`);
            updateHeatMap();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status);
            alert(thrownError);
        }
    });
}

function updateHeatMap() {
    cal = new CalHeatMap();
    cellSize = Math.max(5, getCellSize());

    cal.init({ 
        itemSelector: "#heatmap",
        domain: "year",
        itemName: ["completed habit", "completed habits"],
        subDomain: "day",
        cellSize: cellSize,
        legendCellSize: cellSize,
        start: getStartDate(),
        range: 1,
        tooltip: true,
        data: calendarData,
        legendColors: {
            min: "#D8BFD8",
            max: "#833AB4",
            empty: "lavender"
        },
        legend: getLegendScale(calendarData)
    });
}

function initDatePicker() {
    startDate = formatDate(getStartDate());
    endDate = formatDate(new Date());
    $('#start').val(startDate);
    $('#end').val(endDate);
}

function getChartData() {
    if (startDate === null) {
        initDatePicker();
    }

    let startTimestamp = dateToTimestamp(stringToDate(startDate));
    let endTimestamp = dateToTimestamp(stringToDate(endDate)) + 24 * 60 * 60;

    $.ajax({
        type: 'GET',
        url: `/chart/${startTimestamp}/${endTimestamp}`,
        dataType: 'json',
        success: function(res) {
            chartData = res;
            updateChart();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status);
            alert(thrownError);
        }
    });
}

function updateChart() {
    if (barChart != null) {
        barChart.destroy();
    }

    let data = [];
    let labels = [];
    for (let name in chartData) {
        labels.push(name);
        data.push(chartData[name]);
    }

    var ctx = document.getElementById('bar-chart');
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'completion frequency',
                data: data,
                backgroundColor: 'rgba(131, 58, 180, 0.2)',
                borderColor: 'rgba(131, 58, 180, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                onClick: (e) => e.stopPropagation()
            }
        }
    });
}

$('#start').on('change', function() {
    startDate = $('#start').val();
    getChartData();
})

$('#end').on('change', function() {
    endDate = $('#end').val();
    getChartData();
})

getCalendarData();
getChartData();