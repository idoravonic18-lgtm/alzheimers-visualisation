d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")


let canvas = d3.select('.canvas')
let tooltip = d3.select('.tooltip')

let dataByYear, stateData;

const width = 960;
const height = 500;

const colorScale = d3.scaleSequential()
	.domain([0, 100])
	.interpolator(d3.interpolateBlues);


//for the legend:
const legendWidth = 300;
const legendHeight = 15;

const legendSvg = d3.select("body")
	.append("svg")
	.attr("width", legendWidth + 100)
	.attr("height", 80)
	.style("display", "block")
	.style("margin", "0 auto");

const legendScale = d3.scaleLinear()
	.domain(colorScale.domain())
	.range([0, legendWidth]);

const legendAxis = d3.axisBottom(legendScale)
	.ticks(5)


const legendGradient = legendSvg.append("defs")
	.append("linearGradient")
	.attr("id", "legend-gradient");

legendGradient.append("stop")
	.attr("offset", "0%")
	.attr("stop-color", colorScale(0));

legendGradient.append("stop")
	.attr("offset", "100%")
	.attr("stop-color", colorScale(100));

legendSvg.append("rect")
	.attr("x", 50)
	.attr("y", 10)
	.attr("width", legendWidth)
	.attr("height", legendHeight)
	.style("fill", "url(#legend-gradient)")
	.style("stroke", "#333");

legendSvg.append("g")
	.attr("transform", `translate(50, ${10 + legendHeight})`)
	.call(legendAxis);

legendSvg.append("text")
	.attr("x", legendWidth / 2 + 50)
	.attr("y", 70)
	.attr("text-anchor", "middle")
	.text("% reporting memory loss")

let drawMap = () => {
	d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
		.then(data => {

			stateData = topojson.feature(data, data.objects.states);

			const svg = d3.select(".canvas")
				.attr("width", width)
				.attr("height", height);

			const projection = d3.geoAlbersUsa()
				.translate([width / 2, height / 2])
				.scale(1000);

			const path = d3.geoPath().projection(projection);

			svg.selectAll(".state")
				.data(stateData.features)
				.join("path")
				.attr("class", "state")
				.attr("d", path)
				.attr("stroke", "#333")
				.attr("fill", '#ccc');
		});
};


function updateMap(year) {

	d3.select(".yearLabel").text("Year: " + year);

	const yearData = dataByYear.get(year);
	if (!yearData) return;


	const valueByState = d3.rollup(
		yearData,
		v => d3.mean(v, d => d.value),
		d => d.state
	);

	d3.selectAll(".state")
		.transition()
		.duration(2000)
		.attr("fill", d => {
			const stateName = d.properties.name;
			const value = valueByState.get(stateName);
			return value != null ? colorScale(value) : '#111';
		});

	d3.selectAll(".state")
		.on("mouseover", function (event, d) {
			const stateName = d.properties.name;
			const value = valueByState.get(stateName);

			tooltip
				.style("opacity", 1)
				.html(
					`<strong>${stateName}</strong> </br>  Value : ${value !== undefined ? value.toFixed(2) + "%" : "No data"} `
				);
		})

		.on("mousemove", function (event) {
			tooltip
				.style("left", (event.pageX + 15) + "px")
				.style("top", (event.pageY - 28) + "px");
		})

		.on("mouseout", function () {
			tooltip.style("opacity", 0);
		});

}

drawMap();



const US_STATES = [
	"Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
	"Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
	"Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
	"Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
	"Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
	"New Hampshire", "New Jersey", "New Mexico", "New York",
	"North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
	"Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
	"Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
	"West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
];



//loading the data:
d3.csv("cognitive_decline_only.csv").then(data => {
	const filteredData = data.filter(d =>
		US_STATES.includes(d.LocationDesc) &&
		d.Question.includes("Percentage of older adults who reported subjective cognitive decline or memory loss that interferes with their ability to engage in social activities or household chores") &&
		d.Data_Value !== "" &&
		!isNaN(+d.Data_Value)
	).map(d => ({
		state: d.LocationDesc,
		year_Start: +d.YearStart,
		value: +d.Data_Value
	}));

	dataByYear = d3.group(filteredData, d => d.year_Start);

	const year = Array.from(dataByYear.keys()).sort((a, b) => a - b);

	let index = 0;

	updateMap(year[index]);

	let intervalId;
	let isPlaying = true;

	const button = d3.select(".button");

	function nextYear() {
		index = (index + 1) % year.length;
		updateMap(year[index]);
	}

	intervalId = setInterval(nextYear, 3000);

	button.on("click", () => {
		if (isPlaying) {
			clearInterval(intervalId);
			button.text("Play");
			isPlaying = false;
		} else {
			intervalId = setInterval(nextYear, 3000);
			button.text("Pause");
			isPlaying = true;
		}
	});
})
