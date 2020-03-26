import * as d3 from "d3";
import * as topojson from "topojson-client";
const chinajson = require("../data/china.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";


import {
  base_stats,
  current_stats,
  InfectedEntry
} from "./stats";


var color = d3
  .scaleThreshold<number, string>()
  .domain([10, 20, 50, 100, 500, 700, 1000, 1500, 2000, 3000, 5000])
  .range([
    "#e2d8e4",
    "#c6b1c9",
    "#aa8caf",
    "#8e6995",
    "#72467c",
    "#572364",
    "#523059",
    "#491f53",
    "#4f3654",
    "#2e1733",
    "#461c50",
  ]);



const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #f4f4f4");


const aProjection = d3
  .geoMercator()
  // Let's make the map bigger to fit in our resolution
  .scale(850)
  // Let's center the map
  .translate([-1050, 1000]);



const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(chinajson, chinajson.objects.CHN_adm1);


// Buttons 

document
  .getElementById("initial")
  .addEventListener("click", function handleBaseResults() {
    updateMap(base_stats);
  });

document
  .getElementById("current")
  .addEventListener("click", function handleCurrentResults() {
    updateMap(current_stats);
  });  



  
const updateMap = (data: InfectedEntry[]) => {

  const maxAffected = data.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );
  
  
  const affectedRadiusScale = d3
    .scaleLinear()
    .domain([0, maxAffected])
    .clamp(true)
    .range([5, 30]);
  
  
  const calculateRadiusBasedOnAffectedCases = (comunidad: string) => {  
    const entry = data.find(item => item.name === comunidad);
  
    return entry ? affectedRadiusScale(entry.value) : 0;
  
  };

  const assignRegionBackgroundColor = (name: string) => {
    const item = data.find(
      item => item.name === name
    );
  
    if (item) {
      console.log(item.value);
    }
    return item ? color(item.value) : color(0);
  };
 

  svg
    .selectAll("path")
    .data(geojson["features"])
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("fill", d => assignRegionBackgroundColor(d["properties"]["NAME_1"]))
    .attr("d", geoPath as any)
    .merge(svg.selectAll("path") as any)
    .transition()
    .duration(500)
    .attr("fill", d => assignRegionBackgroundColor(d["properties"]["NAME_1"]));


  const circles = svg.selectAll("circle");

  circles
    .data(latLongCommunities)
    .enter()
    .append("circle")
    .attr("class", "affected-marker")
    .attr("r", function(d) {
      return calculateRadiusBasedOnAffectedCases(d.name);
    })
    .attr("cx", d => aProjection([d.long, d.lat])[0])
    .attr("cy", d => aProjection([d.long, d.lat])[1])

    .merge(circles as any)
    .transition()
    .duration(500)
    .attr("r", function(d) {
      return calculateRadiusBasedOnAffectedCases(d.name);
    });

};

updateMap(base_stats);