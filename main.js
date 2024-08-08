// time parsers/formatters
const parseTime = d3.timeParse("%Y-%m-%d")


d3.csv('data.csv').then(data => {
    // Prepare and clean data
    data.forEach(entry => {
        entry.activated_card = parseTime(entry.activated_card)
        entry.fifth_purchase = parseTime(entry.fifth_purchase)
        entry.first_purchase = parseTime(entry.first_purchase)
        entry.inviter_joined = parseTime(entry.inviter_joined)
        entry.joined = parseTime(entry.joined)
        entry.last_activity = parseTime(entry.last_activity)
        entry.days_till_activation = Number(entry.days_till_activation)
        entry.days_till_first_purchase = Number(entry.days_till_first_purchase)
        entry.days_till_fifth_purchase = Number(entry.days_till_fifth_purchase)
        entry.fifth_purchase_binned = Number(entry.fifth_purchase_binned)
        entry.fifth_purchase_bonus = Number(entry.fifth_purchase_bonus)
        entry.first_purchase_binned = Number(entry.first_purchase_binned)
        entry.joined_bonus = Number(entry.joined_bonus)
    })

    addBarChart();
    addLineChart(data);
    addTree();
    addDonutChart();
    addBarChart2();
    addLineChart2(data);
    addTree2();
})

function addBarChart() {
    const percentages = [
        { month: 'January ($5 bonus)', percentage: 27 , color: "#ff9999"},
        { month: 'February ($10 bonus)', percentage: 73 , color: "#99ccff" }
    ];

    // Set up the margins and dimensions
    const barChartMargin = { top: 60, right: 300, bottom: 40, left: 200 };
    const barChartWidth = 1000 - barChartMargin.left - barChartMargin.right;
    const barChartHeight = 300 - barChartMargin.top - barChartMargin.bottom;

    // Create SVG element
    const barChartSvg = d3.select("#bar-chart").append("svg")
        .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right + 300)
        .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${barChartMargin.left},${barChartMargin.top})`);

    // Set up scales
    const x = d3.scaleLinear()
        .domain([0, 100]) // Percentage scale
        .range([0, barChartWidth]);

    const y = d3.scaleBand()
        .domain(percentages.map(d => d.month))
        .range([0, barChartHeight])
        .padding(0.1) // Inner padding
        .paddingOuter(0.1); // Outer padding

    // Draw bars
    barChartSvg.selectAll(".bar")
        .data(percentages)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.month)+y.bandwidth()/4)
        .attr("width", d => x(d.percentage))
        .attr("height", y.bandwidth()/2)
        .attr("fill", d => d.color);;

    // Add Y axis
    barChartSvg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y))
        .selectAll(".tick text") 
            .style("font-size", "16px");

    // Add title
    barChartSvg.append("text")
        .attr("x", barChartWidth / 2 - 70)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("text-decoration", "underline")
        .text("New Customers Sign-Up Date Proportion");

    // Add labels
    barChartSvg.selectAll(".label")
        .data(percentages)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.percentage) + 5)
        .attr("y", d => y(d.month) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${d.percentage}%`);

    // Add highlight text box
    const highlightText = "45% retention rate\nout of 6,206 new joiners";
    const highlightBoxPadding = 30;
    const highlightBoxWidth = 250; // Increase width for better visibility
    const highlightBoxHeight = 70; // Increase height for better visibility

    // Calculate text dimensions
    const bbox = barChartSvg.append("text")
        .attr("class", "highlight")
        .attr("x", barChartWidth + highlightBoxPadding + highlightBoxWidth / 2)
        .attr("y", barChartHeight / 2 + highlightBoxHeight / 4)
        .attr("text-anchor", "middle")
        .style("visibility", "hidden")
        .text(highlightText)
        .node().getBBox();

    // Remove temporary text node used for dimension calculation
    barChartSvg.selectAll(".highlight").remove();

    // Add background rectangle for the text box
    barChartSvg.append("rect")
        .attr("class", "highlight-box")
        .attr("x", barChartWidth + highlightBoxPadding) // Position to the right of the chart
        .attr("y", barChartHeight / 2 - highlightBoxHeight / 2) // Center vertically
        .attr("width", highlightBoxWidth) // Width of the rectangle
        .attr("height", highlightBoxHeight) // Height of the rectangle
        .attr("rx", 10); // Rounded corners

    // Add the actual highlight text
    highlightText.split("\n").forEach((line, i) => {
        barChartSvg.append("text")
            .attr("class", "highlight")
            .attr("x", barChartWidth + highlightBoxPadding + highlightBoxWidth / 2 - 110)
            .attr("y", barChartHeight / 2 - highlightBoxHeight / 4 + i * 20 + 8) // Adjust line spacing
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(line);
        })
}

function addLineChart(data) {
    // Compute the year and month in 'YYYY-MM' format and count occurrences
    const groupedData = d3.rollup(
        data,
        v => v.length,
        d => d.inviter_joined ? (d.inviter_joined.getFullYear() <= 2018 ? '< 2019' : d3.timeFormat("%Y-%m")(d.inviter_joined)) : null
    );
    const monthlyCounts = Array.from(groupedData, ([key, value]) => ({ key, value }))
        .filter(d => d.key)
        .sort((a, b) => d3.ascending(a.key === '< 2019' ? '0' : a.key, b.key === '< 2019' ? '0' : b.key));

    // Calculate percentages
    const total = d3.sum(monthlyCounts, d => d.value);
    monthlyCounts.forEach(d => d.percentage = Math.round((d.value / total) * 100));

    // Define margins and dimensions
    const margin = { top: 50, right: 30, bottom: 80, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create an SVG element
    const svg = d3.select("#line-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define scales
    const x = d3.scaleBand()
        .domain(monthlyCounts.map(d => d.key))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(monthlyCounts, d => d.percentage)])
        .nice()
        .range([height, 0]);

    // Define line generator
    const line = d3.line()
        .x(d => x(d.key) + x.bandwidth() / 2)
        .y(d => y(d.percentage));

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("font-size", "12px");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(10))
        .style("font-size", "12px");

    // Add line path
    svg.append("path")
        .datum(monthlyCounts)
        .attr("fill", "none")
        .attr("stroke", "#99ccff")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add data points
    svg.selectAll("circle")
        .data(monthlyCounts)
        .enter().append("circle")
        .attr("cx", d => x(d.key) + x.bandwidth() / 2)
        .attr("cy", d => y(d.percentage))
        .attr("r", 3)
        .attr("fill", "#99ccff");

    // Add labels
    svg.selectAll(".label")
        .data(monthlyCounts)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.key) + x.bandwidth() / 2)
        .attr("y", d => y(d.percentage) - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text(d => `${d.percentage}%`);

    // Add titles and labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("text-decoration", "underline")
        .text("Referrer's Sign-Up Date Distribution");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 60)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Percentage (%)")
        .style("font-size", "14px");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Year-Month")
        .style("font-size", "14px");
}

function addTree() {
    // Define the data for the tree
    const treeData = {
        name: "$131,200",
        value: 100,
        children: [
            {
                name: "$107,130",
                value: 82,
                children: [
                    { name: "$16,990", value: 13, description: "January", color: "#ff9999" }, // Light red
                    { name: "$90,140", value: 69, description: "February", color: "#99ccff" }  // Light blue
                ],
                description: "Sign Ups",
                color: "#a3e4a1"  // Light green
            },
            {
                name: "$24,070",
                value: 18,
                description: "Fifth purchase",
                color: "#e6e6e6"  // Light gray
            }
        ],
        description: "Bonuses Paid",
        color: "#FFA07A"  // Light blue
    };

    // Set up the SVG dimensions and margins
    const margin = { top: 10, right: 120, bottom: 10, left: 200 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create an SVG element
    const svg = d3.select("#tree")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a tree layout
    const tree = d3.tree()
        .size([height, width]);

    // Create a hierarchy from the data
    const root = d3.hierarchy(treeData, d => d.children);
    tree(root);

    // Function to scale the height of rectangles based on value
    const maxValue = d3.max(root.descendants(), d => d.data.value);
    const scaleHeight = d3.scaleLinear()
        .domain([0, maxValue])
        .range([20, 200]); // Minimum and maximum height of rectangles

    // Add links between nodes
    svg.selectAll(".link")
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
            return `M${d.y},${d.x}
                    C${d.y + 50},${d.x}
                    ${d.parent.y + 50},${d.parent.x}
                    ${d.parent.y},${d.parent.x}`;
        });

    // Add nodes
    const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    // Add node rectangles (boxes)
    node.append("rect")
        .attr("x", -75) // Adjust the width of the box
        .attr("y", d => -scaleHeight(d.data.value) / 2) // Center the rectangle vertically
        .attr("width", 150) // Width of the box
        .attr("height", d => scaleHeight(d.data.value)) // Height of the box proportional to value
        .attr("class", "box")
        .style("fill", d => d.data.color || "#ffffff");

    // Add node text
    node.append("text")
        .attr("dy", ".35em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("class", "label")
        .text(d => d.data.name);

    // Add descriptions
    node.append("text")
        .attr("dy", d => scaleHeight(d.data.value) / 2 + 15)
        .attr("x", 0)
        .attr('y', 5)
        .attr("text-anchor", "middle")
        .attr("class", "value")
        .text(d => d.data.description || "");
}

function addDonutChart() {
    const data = [
        { label: "GEN Z", percentage: 52.2, color: "#1f77b4" },  // Blue
        { label: "GEN Y", percentage: 33.3, color: "#ff7f0e" },  // Orange
        { label: "GEN X", percentage: 10.7, color: "#2ca02c" },  // Green
        { label: "BOOMER", percentage: 3.7, color: "#d62728" },  // Red
        { label: "SILENT", percentage: 0.1, color: "#9467bd" }   // Purple
    ];

    const width = 1000;
    const height = 500;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select("#donut-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.label))
        .range(data.map(d => d.color));

    const pie = d3.pie()
        .value(d => d.percentage)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(radius * 0.5) // Inner radius of the donut
        .outerRadius(radius * 0.8); // Outer radius of the donut

    const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    const g = svg.selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc');

    g.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.label))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7);

    g.append('text')
        .attr('class', 'percentage-text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('dy', '0.35em')
        .text(d => `${d.data.percentage.toFixed(0)}%`);

    svg.selectAll('allPolylines')
        .data(pie(data))
        .enter()
        .append('polyline')
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            const posA = arc.centroid(d); // line insertion in the slice
            const posB = outerArc.centroid(d); // line break: we use the other arc generator that has been built only for that
            const posC = outerArc.centroid(d); // Label position = almost the same as posB
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // to have the label right in the middle
            posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // Align label to right or left
            if (d.data.label === 'BOOMER') posC[1] += 15; // Adjust BOOMER label
            if (d.data.label === 'SILENT') posC[1] -= 12; // Adjust SILENT label
            return [posA, posB, posC]
        });

    svg.selectAll('allLabels')
        .data(pie(data))
        .enter()
        .append('text')
        .text(d => d.data.label)
        .attr('transform', function(d) {
            const pos = outerArc.centroid(d);
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            if (d.data.label === 'BOOMER') pos[1] += 15; // Adjust BOOMER label
            if (d.data.label === 'SILENT') pos[1] -= 12; // Adjust SILENT label
            return `translate(${pos})`;
        })
        .style('text-anchor', function(d) {
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            return (midangle < Math.PI ? 'start' : 'end')
        });
}

function addBarChart2() {
    const percentages = [
        { month: 'Activated', percentage: 65 , color: "#ff9999"},
        { month: 'Not activated', percentage: 35 , color: "#99ccff" }
    ];

    // Set up the margins and dimensions
    const barChartMargin = { top: 60, right: 100, bottom: 40, left: 200 };
    const barChartWidth = 1000 - barChartMargin.left - barChartMargin.right;
    const barChartHeight = 300 - barChartMargin.top - barChartMargin.bottom;

    // Create SVG element
    const barChartSvg = d3.select("#bar-chart-2").append("svg")
        .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
        .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${barChartMargin.left},${barChartMargin.top})`);

    // Set up scales
    const x = d3.scaleLinear()
        .domain([0, 100]) // Percentage scale
        .range([0, barChartWidth]);

    const y = d3.scaleBand()
        .domain(percentages.map(d => d.month))
        .range([0, barChartHeight])
        .padding(0.1) // Inner padding
        .paddingOuter(0.1); // Outer padding

    // Draw bars
    barChartSvg.selectAll(".bar")
        .data(percentages)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.month)+y.bandwidth()/4)
        .attr("width", d => x(d.percentage))
        .attr("height", y.bandwidth()/2)
        .attr("fill", d => d.color);;

    // Add Y axis
    barChartSvg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y))
        .selectAll(".tick text") 
            .style("font-size", "16px");

    // Add title
    barChartSvg.append("text")
        .attr("x", barChartWidth / 2 - 70)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("text-decoration", "underline")
        .text("Card Activation Proportion");

    // Add labels
    barChartSvg.selectAll(".label")
        .data(percentages)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.percentage) + 5)
        .attr("y", d => y(d.month) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${d.percentage}%`);
}

function addLineChart2(data) {
    // Define the binning function
    function binDays(days) {
        return days <= 30 ? days.toString() : '>30';
    }

    // Define function to convert bin labels to numeric values
    function convertDaysToNumeric(day) {
        return day === '>30' ? 31 : parseInt(day);
    }

    // Process the data
    data.forEach(d => {
        d.days_till_first_purchase_binned = binDays(d.days_till_first_purchase);
        d.days_till_fifth_purchase_binned = binDays(d.days_till_fifth_purchase);
    });

    // Calculate counts for first purchase
    const firstPurchaseGrouped = d3.group(data, d => d.days_till_first_purchase_binned);
    const firstPurchaseCounts = Array.from(firstPurchaseGrouped, ([key, values]) => ({
        Days: key,
        Count: values.length,
        Purchase_Type: 'First Purchase',
        color: '#ff9999'
    }));

    // Calculate counts for fifth purchase
    const fifthPurchaseGrouped = d3.group(data, d => d.days_till_fifth_purchase_binned);
    const fifthPurchaseCounts = Array.from(fifthPurchaseGrouped, ([key, values]) => ({
        Days: key,
        Count: values.length,
        Purchase_Type: 'Fifth Purchase',
        color: '#99ccff'
    }));

    // Combine the data
    const combinedData = firstPurchaseCounts.concat(fifthPurchaseCounts);

    // Convert 'Days' to numeric for plotting
    combinedData.forEach(d => {
        d.Days_numeric = convertDaysToNumeric(d.Days);
    });
    const filteredData = combinedData.filter(d => d.Days_numeric !== -1);

    // Set dimensions and margins
    const margin = { top: 100, right: 30, bottom: 100, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select("#line-chart-2").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set x and y scales
    const x = d3.scaleLinear()
        .domain([0, 31])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Count)])
        .range([height, 0]);

    // Define line generator
    const lineGenerator = d3.line()
        .x(d => x(d.Days_numeric))
        .y(d => y(d.Count))

    // Create a color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Group data by purchase type
    const nestedData = d3.group(filteredData, d => d.Purchase_Type);
    nestedData.forEach((values, key) => {
        values.sort((a, b) => a.Days_numeric - b.Days_numeric);
    });
    
    // Add lines
    nestedData.forEach((values, type) => {
        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", values[0].color)
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        svg.selectAll(`.dot-${type}`)
            .data(values)
            .enter().append("circle")
            .attr("class", `dot-${type}`)
            .attr("fill", values[0].color)
            .attr("stroke", values[0].color)
            .attr("cx", d => x(d.Days_numeric))
            .attr("cy", d => y(d.Count))
            .attr("r", 3);
    });

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickValues([...Array(31).keys()].concat([31]))
            .tickFormat(d => d === 31 ? '>30' : d));

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add title and labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Distribution of Days Until Purchases");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom / 1.5)
        .attr("text-anchor", "middle")
        .text("Days");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left / 1.5)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Count");

    // Add legend
    const legendData = [
        { type: "First Purchase", color: "#ff9999" },
        { type: "Fifth Purchase", color: "#99ccff" }
    ];
    
    const legend = svg.selectAll(".legend")
        .data(legendData)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(-10,${i * 20})`);
    
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => d.color);
    
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d.type);
}

function addTree2() {
    // Define the data for the tree
    const treeData = {
        name: "6,206 customers",
        description: "",
        color: "#FF7043",  // Red orange
        value: 100,
        children: [
            {
                name: "No transaction",
                value: 12,
                description: "12%",
                color: "#FFA07A"  // light orange
            },
            {
                name: ">= 1 transaction",
                value: 88,
                description: "88%",
                color: "#42A5F5",  // Blue
                children: [
                    {
                        name: "No purchase",
                        value: 14,
                        description: "14%",
                        color: "#90CAF9",  // Light blue
                    },
                    {
                        name: ">= 1 purchase",
                        value: 74,
                        description: "74%",
                        color: "#FFD54F", // yellow
                        children: [
                            {
                                name: "< 5 purchases",
                                value: 17,
                                description: "17%",
                                color: "#FFEB3B"  // Bright Yellow
                            },
                            {
                                name: ">= 5 purchases",
                                value: 57,
                                description: "57%",
                                color: "#66BB6A",  // Green
                                children: [
                                    {
                                        name: "Within 30 days",
                                        value: 39,
                                        description: "39%",
                                        color: "#AB47BC"  // Purple
                                    },
                                    {
                                        name: "After 30 days",
                                        value: 18,
                                        description: "18%",
                                        color: "#4CAF50"  // dark green
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    };

    // Set up the SVG dimensions and margins
    const margin = { top: 10, right: 120, bottom: 10, left: 200 };
    const width = 1000 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    // Create an SVG element
    const svg = d3.select("#tree-2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a tree layout
    const tree = d3.tree()
        .size([height, width]);

    // Create a hierarchy from the data
    const root = d3.hierarchy(treeData, d => d.children);
    tree(root);

    // Function to scale the height of rectangles based on value
    const maxValue = d3.max(root.descendants(), d => d.data.value);
    const scaleHeight = d3.scaleLinear()
        .domain([0, maxValue])
        .range([20, 200]); // Minimum and maximum height of rectangles

    // Add links between nodes
    svg.selectAll(".link")
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
            return `M${d.y},${d.x}
                    C${d.y + 50},${d.x}
                    ${d.parent.y + 50},${d.parent.x}
                    ${d.parent.y},${d.parent.x}`;
        });

    // Add nodes
    const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    // Add node rectangles (boxes)
    node.append("rect")
        .attr("x", -75) // Adjust the width of the box
        .attr("y", d => -scaleHeight(d.data.value) / 2) // Center the rectangle vertically
        .attr("width", 150) // Width of the box
        .attr("height", d => scaleHeight(d.data.value)) // Height of the box proportional to value
        .attr("class", "box")
        .style("fill", d => d.data.color || "#ffffff");

    // Add node text
    node.append("text")
        .attr("dy", ".35em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr('font-size', '10px')
        .attr("class", "label")
        .text(d => d.data.name);

    // Add descriptions
    node.append("text")
        .attr("dy", d => scaleHeight(d.data.value) / 2 + 15)
        .attr("x", 0)
        .attr('y', 5)
        .attr("text-anchor", "middle")
        .attr('font-size', '12px')
        .attr("class", "value")
        .text(d => d.data.description || "");
}
