// 設定初始選單的選項
const mySelect = document.getElementById("mySelect");
mySelect.addEventListener("change", function() {
  ShowChart(this.value);
});

// 設定選項
function setOption(model){
  let newOption = document.createElement("option");
  newOption.text = model;
  newOption.value = model;
  mySelect.add(newOption);
}
// 設定所有選項
const array = ["ford", "merc", "skoda", "toyota", "vauxhall", "vw", "audi", "bmw"];
for (x in array){
  setOption(array[x]);
}

// 設定顯示的圖片
function ShowChart(model){
  d3.csv(`data/${model}.csv`, type).then(
    res=>{
      refresh();
      ready(res);
    }
  ) 
}


function formatTicks(d){
  return d3.format('~s')(d)
          .replace('M','mil')
          .replace('G','bil')
          .replace('T','tri')
}

const outdoor = document.getElementById("outdoor")

// 最後用model和price來作圖

// 把上一張圖表刪除並放上另一張圖表
function refresh(){
  let myDiv = document.getElementById("myDiv");
  myDiv.parentNode.removeChild(myDiv);
  let newDiv = document.createElement("div");
  newDiv.id="myDiv";
  newDiv.className="bar-chart-container";
  outdoor.appendChild(newDiv);
}

// 轉換成數值
function type(d){
  return {
    model: d.model,
    year: +d.year,
    price: +d.price,
    transmission: d.transmission,
    milleage: +d.milleage,
    fuelType: d.fuelType,
    tax: +d.tax,
    mpg: +d.mpg,
    engineSize: +d.engineSize,
    count: 1,

  }
}

// data selection 
// condition :
// year: 2013 - now
// tax: 145-174
// mpg: 40-55
function filterData(data) {
  return data.filter(d =>{
      return (
        d.year >= 2013 && 
        d.tax >= 145 && d.tax <= 174 &&
        d.mpg >= 40.0 && d.mpg <= 55.0
      );
    }
  );
}

function prepareBarChart(data) {
  // console.log(data);
  
  const dataMap = d3.rollup(
    data, 
    p => d3.sum(p, leaf => leaf.price), 
    m => m.model,
  );
  const dataArray = Array.from(dataMap, d=>({types:d[0], price:d[1]}));
  return dataArray
}



//Main
function ready(data){
  const CarClean = filterData(data);
  const BarChartData = prepareBarChart(CarClean).sort(
    (a, b) => {
      return d3.descending(a.price, b.price);
    }
  );
  // console.log(BarChartData);
  setupCanvas(BarChartData);
}

// draw
function setupCanvas(barChartData){
  const svg_width = 700;
  const svg_height = 750;
  const chart_margin = {top:80,right:40,bottom:40,left:80};
  const chart_width = svg_width - (chart_margin.left + chart_margin.right);
  const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);

  const this_svg = d3.select('.bar-chart-container').append('svg')
                   .attr('width', svg_width).attr('height', svg_height)
                   .append('g')
                   .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);
  
  //Find min & max
  const xExtent = d3.extent(barChartData, d=>d.price);
  // debugger;
  const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, chart_width]);
  const xMax = d3.max(barChartData, d => d.price);
  const xScale_v2 = d3.scaleLinear().domain([0,xMax]).range([0, chart_width]);
  //Short writing
  const xScale_v3 = d3.scaleLinear([0,xMax],[0,chart_width]);

  const yScale = d3.scaleBand().domain(barChartData.map(d=>d.types))
                               .rangeRound([0,chart_height])
                               .paddingInner(0.15);
  // console.log(yScale.bandwidth());
  //Draw Bars
  const bars = this_svg.selectAll('.bar')
                       .data(barChartData)
                       .enter()
                       .append('rect')
                       .attr('class','bar')
                       .attr('x',0)
                       .attr('y',d=>yScale(d.types))
                       .attr('width', d=>xScale_v3(d.price))
                       .attr('height',yScale.bandwidth())
                       .style('fill','DarkGreen');
  
  const header = this_svg.append('g').attr('class','bar-header')
                 .attr('transform',`translate(0,${-chart_margin.top/2})`)
                 .append('text');
  header.append('tspan').text('Total price by types in $US');
  header.append('tspan').text('Years:2013~now  ')
        .attr('x',0).attr('y',20)
        .style('font-size','0.8em').style('fill','#555');

  const xAxis = d3.axisTop(xScale_v3)
                  .tickFormat(formatTicks)
                  .tickSizeInner(-chart_height)
                  .tickSizeOuter(0);
  const xAxisDraw = this_svg.append('g').attr('class','x axis').call(xAxis);

  const yAxis = d3.axisLeft(yScale).tickSize(0);
  const yAxisDraw = this_svg.append('g').attr('class','y axis').call(yAxis);
  yAxisDraw.selectAll('text').attr('dx','-0.6em');
}