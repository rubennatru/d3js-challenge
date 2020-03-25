import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("../data/spain.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";


import {
  base_stats,
  current_stats,
  InfectedEntry
} from "./stats";



var color = d3
  .scaleThreshold<number, string>()
  .domain([0, 100, 500, 700, 1000, 1500, 2000])
  .range([
    "#e2d8e4",
    "#c6b1c9",
    "#aa8caf",
    "#8e6995",
    "#72467c",
    "#72467c",
    "#4c195a"
  ]);



  const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #dfe0e0");


const aProjection = d3Composite
  .geoConicConformalSpain()
  // Let's make the map bigger to fit in our resolution
  .scale(3300)
  // Let's center the map
  .translate([500, 400]);



const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);


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
    .range([5, 40]); // 50 pixel max radius, we could calculate it relative to width and height
  
  
  const calculateRadiusBasedOnAffectedCases = (comunidad: string) => {  
    const entry = data.find(item => item.name === comunidad);
  
    return entry ? affectedRadiusScale(entry.value) : 0;
  
  };

  const assignRegionBackgroundColor = (comunidad: string) => {
    const item = data.find(
      item => item.name === comunidad
    );
  
    if (item) {
      console.log(item.value);
    }
    return item ? color(item.value) : color(0);
  };
 
  const drawmap = svg.selectAll("path");

  drawmap
    .data(geojson["features"])
    .enter()
    .append("path")
    .attr("class", "country")
    .style("fill", function(d: any) {
      return assignRegionBackgroundColor(d.properties.NAME_1);
    })
    // data loaded from json file
    .attr("d", geoPath as any);


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
