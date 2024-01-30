$(function() {
    let templist = [];
    let co2list = [];
    let days = [];
    let selectedDay;
    let lastId = 0;
    let myChart;
    let periodic;

    $(document).ready(function() {
        initialize();
    });

    function initialize() {
        $.ajax({
            type: 'POST',
            url: 'get_day_records.php',
            dataType: 'json',
        }).done(function(responseData) {
            days = getPastDays(responseData);
            populateDayDropdown();
            selectDay();
        }).fail(function(xhr, status, error) {
            handleAjaxError(status, error);
        });
    }

    function getPastDays(data) {
        let pastDays = [];
        let today = moment();

        data.forEach(item => {
            let pastDate = moment(item.time);
            while (pastDate.isSameOrBefore(today, 'day')) {
                pastDays.push(pastDate.format("YYYY-MM-DD"));
                pastDate.add(1, 'd');
            }
        });

        return pastDays.reverse();
    }

    function populateDayDropdown() {
        let selectDay = $("#select_day");
        days.forEach(day => {
            $("<option>", { value: day, text: day }).appendTo(selectDay);
        });
    }

    function selectDay() {
        let selectDay = $("#select_day");

        selectDay.change(() => {
            selectDay.css("color", "#000");
            selectedDay = selectDay.val();
        });
    }

    $("#start").on('click', function() {
        let selectDay = $("#select_day");

        if (myChart) {
            myChart.destroy();
            co2list = [];
            templist = [];
        }

        $.ajax({
            type: 'POST',
            url: 'get_today_records.php',
            data: {
                date: selectedDay,
                count: 0
            },
            dataType: 'json',
        }).done(function(responseData) {
            handleSuccess(responseData);
        }).fail(function(xhr, status, error) {
            handleAjaxError(status, error);
        });
    });

    function handleSuccess(responseData) {
        hideCurrentValues();

        if (responseData.length === 0) {
            showNoDataMessage();
            return;
        }

        setDayValues(responseData);
        drawChart();
        if (selectedDay === moment().format("YYYY-MM-DD")) {
            setRealtimeUpdates();
        } else {
            showSelectedDayInfo();
            clearRealtimeUpdates();
        }
    }

    function hideCurrentValues() {
        $("#current_time, #current_co2, #current_temp, #max_co2, #min_co2, #max_temp, #min_temp").css('visibility', 'hidden');
    }

    function showNoDataMessage() {
        $("#current_time").css('visibility', 'visible').text("No data available");
    }

    function setDayValues(data) {
        lastId = data[data.length - 1].id;
        co2list = data.map(item => ({ x: item.time, y: item.co2 }));
        templist = data.map(item => ({ x: item.time, y: item.temperature }));
    }

    function showSelectedDayInfo() {
        $("#current_time").css('visibility', 'visible').text("Selected day: " + selectedDay);
        setMaxMinValues();
        clearRealtimeUpdates();
    }

    function setRealtimeUpdates() {
        setMaxMinValues();
        periodic = setInterval(update, 5000);
    }

    function clearRealtimeUpdates() {
        if (periodic) {
            clearInterval(periodic);
        }
    }

    function setMaxMinValues() {
        let co2Max = maxValue(co2list);
        let co2Min = minValue(co2list);
        let tempMax = maxValue(templist);
        let tempMin = minValue(templist);

        $("#max_co2").css('visibility', 'visible').text("Max CO2 concentration: " + co2Max + "ppm");
        $("#min_co2").css('visibility', 'visible').text("Min CO2 concentration: " + co2Min + "ppm");
        $("#max_temp").css('visibility', 'visible').text("Max temperature: " + tempMax.toFixed(1) + "°C");
        $("#min_temp").css('visibility', 'visible').text("Min temperature: " + tempMin.toFixed(1) + "°C");
    }

    function maxValue(data) {
        return Math.max(...data.map(item => Number(item.y)));
    }

    function minValue(data) {
        return Math.min(...data.map(item => Number(item.y)));
    }

    function drawChart() {
        const ctx = document.getElementById('myChart');
        const data = {
            datasets: [
                createDataset("CO2", co2list, "#082f72", "DarkBlue", "y1", "CO2 ( ppm )"),
                createDataset("Temperature", templist, "#840202", "DarkRed", "y2", "Temperature ( ℃ )")
            ]
        };

        const options = {
            legend: { display: false },
            scales: {
                x: {
                    type: 'time',
                    time: { parser: 'YYYY-MM-DD HH:mm:ss', unit: 'hour', stepSize: 1, displayFormats: { 'hour': 'HH:00' } },
                    ticks: getConfig("MidnightBlue", 20),
                    min: `${selectedDay} 00:00:00`,
                    max: `${selectedDay} 24:00:00`
                },
                y1: createAxisConfig(0, 1200, 'DarkBlue', 20, 'left', 'CO2 ( ppm )', '#082f72'),
                y2: createAxisConfig(0, 40, 'DarkRed', 20, 'right', 'Temperature ( ℃ )', '#840202'),
            }
        };

        myChart = new Chart(ctx, { type: 'line', data, options });
    }

    function createDataset(label, data, backgroundColor, borderColor, yAxisID, title) {
        return {
            label,
            data,
            cubicInterpolationMode: 'monotone',
            borderWidth: 2,
            pointRadius: 0,
            backgroundColor,
            borderColor,
            yAxisID,
        };
    }

    function createAxisConfig(min, max, ticksColor, fontSize, position, titleText, titleColor) {
        return {
            min,
            max,
            ticks: getConfig(ticksColor, fontSize),
            position,
            title: { display: true, text: titleText, color: titleColor, font: { size: 18 } },
        };
    }

    function getConfig(color, fontSize) {
        return { color, font: { size: fontSize } };
    }

    function update() {
        console.log(lastId);
        $.ajax({
            type: 'POST',
            url: 'get_update.php',
            data: {
                last_id: lastId,
            },
            dataType: 'json',
        }).done(function(responseData) {
            chartUpdate(responseData);
        }).fail(function(xhr, status, error) {
            handleAjaxError(status, error);
        });

        function chartUpdate(responseData) {
            if (responseData.length === 0) {
                return;
            }

            setDayValues(responseData);
            setMaxMinValues();
            myChart.update();
        }
    }

    function handleAjaxError(status, error) {
        console.log(status);
        console.log(error);
    }
});