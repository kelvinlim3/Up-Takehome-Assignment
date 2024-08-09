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
    addRect1();
    addRect2();
})

function addBarChart() {
    const percentages = [
        { month: 'January ($5 bonus)', percentage: 27 , color: "#FF7043"},  // Orange
        { month: 'February ($10 bonus)', percentage: 73 , color: "#42A5F5" } // Blue
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
        .attr("fill", d => d.color);

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
        .style("font-weight", "bold")
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
    });
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
        .attr("stroke", "#42A5F5")  // Blue
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add data points
    svg.selectAll("circle")
        .data(monthlyCounts)
        .enter().append("circle")
        .attr("cx", d => x(d.key) + x.bandwidth() / 2)
        .attr("cy", d => y(d.percentage))
        .attr("r", 4)
        .attr("fill", "#42A5F5");  // Blue

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
        .style("font-weight", "bold")
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
                    { name: "$16,990", value: 13, description: "January", color: "#FF7043" }, // Orange
                    { name: "$90,140", value: 69, description: "February", color: "#42A5F5" }  // Blue
                ],
                description: "Sign-Ups",
                color: "#66BB6A"  // Green
            },
            {
                name: "$24,070",
                value: 18,
                description: "Fifth Purchase",
                color: "#EF5350"  // Red
            }
        ],
        description: "Bonuses Paid",
        color: "#FFA07A"  // Light Orange
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
        })
        .attr("stroke", "#888888")
        .attr("stroke-width", 2)
        .attr("fill", "none");

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
        .style("fill", d => d.data.color || "#ffffff")
        .style("stroke", "#888888")
        .style("stroke-width", 2);

    // Add node text
    node.append("text")
        .attr("dy", ".35em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("class", "label")
        .text(d => d.data.name)
        .attr("fill", "#333");

    // Add descriptions
    node.append("text")
        .attr("dy", d => scaleHeight(d.data.value) / 2 + 15)
        .attr("x", 0)
        .attr('y', 5)
        .attr("text-anchor", "middle")
        .attr("class", "value")
        .text(d => d.data.description || "")
        .attr("fill", "#777");
}

function addDonutChart() {
    const data = [
        { label: "GEN Z", percentage: 52.2, color: "#FF7043" },  // Orange
        { label: "GEN Y", percentage: 33.3, color: "#42A5F5" },  // Blue
        { label: "GEN X", percentage: 10.7, color: "#66BB6A" },  // Green
        { label: "BOOMER", percentage: 3.7, color: "#EF5350" },  // Red
        { label: "SILENT", percentage: 0.1, color: "#8E24AA" }   // Purple
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
        .text(d => `${d.data.percentage.toFixed(0)}%`)
        .attr("fill", "#333");

    svg.selectAll('allPolylines')
        .data(pie(data))
        .enter()
        .append('polyline')
        .attr("stroke", "#888888")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            const posA = arc.centroid(d);
            const posB = outerArc.centroid(d); // Line break point
            const posC = outerArc.centroid(d); // Label position
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // Align labels to the right or left
            if (d.data.label === 'BOOMER') posC[1] += 15; // Adjust BOOMER label
            if (d.data.label === 'SILENT') posC[1] -= 12; // Adjust SILENT label
            return [posA, posB, posC];
        });

    svg.selectAll('allLabels')
        .data(pie(data))
        .enter()
        .append('text')
        .text(d => d.data.label)
        .attr('transform', function(d) {
            const pos = outerArc.centroid(d);
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            if (d.data.label === 'BOOMER') pos[1] += 15; // Adjust BOOMER label
            if (d.data.label === 'SILENT') pos[1] -= 12; // Adjust SILENT label
            return `translate(${pos})`;
        })
        .style('text-anchor', function(d) {
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return (midangle < Math.PI ? 'start' : 'end');
        })
        .style("font-size", "14px")
        .attr("fill", "#333");
}

function addBarChart2() {
    const percentages = [
        { month: 'Activated', percentage: 65 , color: "#FF7043"},  // Orange
        { month: 'Not activated', percentage: 35 , color: "#66BB6A" } // Green
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
        .attr("y", d => y(d.month) + y.bandwidth() / 4)
        .attr("width", d => x(d.percentage))
        .attr("height", y.bandwidth() / 2)
        .attr("fill", d => d.color);

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
        .attr("fill", "#333")
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
        color: '#FF7043'  // Orange
    }));

    // Calculate counts for fifth purchase
    const fifthPurchaseGrouped = d3.group(data, d => d.days_till_fifth_purchase_binned);
    const fifthPurchaseCounts = Array.from(fifthPurchaseGrouped, ([key, values]) => ({
        Days: key,
        Count: values.length,
        Purchase_Type: 'Fifth Purchase',
        color: '#42A5F5'  // Blue
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
    const height = 500 - margin.top - margin.bottom;

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
        .y(d => y(d.Count));

    // Add lines
    const nestedData = d3.group(filteredData, d => d.Purchase_Type);
    nestedData.forEach((values, type) => {
        values.sort((a, b) => a.Days_numeric - b.Days_numeric);

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
            .attr("r", 4);
    });

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickValues([...Array(31).keys()].concat([31]))
            .tickFormat(d => d === 31 ? '>30' : d))
        .selectAll("text")
        .style("font-size", "12px");

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(10))
        .style("font-size", "12px");

    // Add title and labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Distribution of Days Until Purchases");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom / 1.5)
        .attr("text-anchor", "middle")
        .text("Days")
        .style("font-size", "14px");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left / 1.5)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Count");

    // Add legend
    const legendData = [
        { type: "First Purchase", color: "#FF7043" },  // Orange
        { type: "Fifth Purchase", color: "#42A5F5" }   // Blue
    ];
    
    const legend = svg.selectAll(".legend")
        .data(legendData)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);
    
    legend.append("rect")
        .attr("x", width - 30)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => d.color);
    
    legend.append("text")
        .attr("x", width - 36)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .style("font-size", "14px")
        .text(d => d.type);
}

function addTree2() {
    // Define the data for the tree
    const treeData = {
        name: "6,206 customers",
        description: "",
        color: "#FF7043",  // Orange
        value: 100,
        children: [
            {
                name: "No transaction",
                value: 12,
                description: "12%",
                color: "#FFAB91"  // Light Orange
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
                        color: "#90CAF9",  // Light Blue
                    },
                    {
                        name: ">= 1 purchase",
                        value: 74,
                        description: "74%",
                        color: "#66BB6A", // Green
                        children: [
                            {
                                name: "< 5 purchases",
                                value: 17,
                                description: "17%",
                                color: "#A5D6A7"  // Light Green
                            },
                            {
                                name: ">= 5 purchases",
                                value: 57,
                                description: "57%",
                                color: "#EF5350",  // Red
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
                                        color: "#FFCDD2"  // Light Red
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
        })
        .attr("stroke", "#888888")
        .attr("stroke-width", 2)
        .attr("fill", "none");

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
        .style("fill", d => d.data.color || "#ffffff")
        .style("stroke", "#888888")
        .style("stroke-width", 2);

    // Add node text
    node.append("text")
        .attr("dy", ".35em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("class", "label")
        .text(d => d.data.name)
        .attr("fill", "#333");

    // Add descriptions
    node.append("text")
        .attr("dy", d => scaleHeight(d.data.value) / 2 + 15)
        .attr("x", 0)
        .attr('y', 5)
        .attr("text-anchor", "middle")
        .attr("class", "value")
        .text(d => d.data.description || "")
        .attr("fill", "#777");
}

function addRect1(){
    // Data for January 1st, 15th, and 31st
    const data = [
        { date: 'January 1st', estimate: 67.44, ci_lower: 53.44, ci_upper: 81.45 },
        { date: 'January 15th', estimate: 52.08, ci_lower: 37.95, ci_upper: 66.22 },
        { date: 'January 31st', estimate: 41.38, ci_lower: 28.70, ci_upper: 54.05 }
    ];

    const actualProportion = 56.74; // Actual January proportion

    const margin = { top: 80, right: 30, bottom: 80, left: 120 },
          width = 1000 - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#rect-1")
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleLinear()
                .domain([0, 100])
                .range([0, width]);

    const y = d3.scaleBand()
                .domain(data.map(d => d.date))
                .range([0, height])
                .padding(0.4);

    // Add the x-axis with percentage labels
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x).tickFormat(d => d + "%"))
       .selectAll("text")
       .style("font-size", "14px"); // Make x-axis labels bigger

    // Add the y-axis
    svg.append("g")
       .call(d3.axisLeft(y))
       .selectAll("text")
       .style("font-size", "14px"); // Make y-axis labels bigger

    // Add the confidence intervals (horizontal lines)
    svg.selectAll(".ci-line")
       .data(data)
       .enter()
       .append("line")
       .attr("class", "ci-line")
       .attr("x1", d => x(d.ci_lower))
       .attr("x2", d => x(d.ci_upper))
       .attr("y1", d => y(d.date) + y.bandwidth() / 2)
       .attr("y2", d => y(d.date) + y.bandwidth() / 2)
       .attr("stroke", "#42A5F5")  // Blue
       .attr("stroke-width", 2);
    
    // Add the estimate points (circles)
    svg.selectAll(".estimate-point")
       .data(data)
       .enter()
       .append("circle")
       .attr("class", "estimate-point")
       .attr("cx", d => x(d.estimate))
       .attr("cy", d => y(d.date) + y.bandwidth() / 2)
       .attr("r", 5)
       .attr("fill", "#FF7043");  // Orange

    // Add title
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", -30)
       .attr("text-anchor", "middle")
       .style("font-size", "18px")
       .style("font-weight", "bold")
       .text("Proportion Estimates and Confidence Intervals for January");

    // Add vertical line at actual January proportion
    svg.append("line")
       .attr("class", "actual-line")
       .attr("x1", x(actualProportion))
       .attr("x2", x(actualProportion))
       .attr("y1", 0)
       .attr("y2", height)
       .attr("stroke", "#66BB6A")  // Green
       .attr("stroke-width", 2)
       .attr("stroke-dasharray", "4,4");

    // Label for the actual proportion line
    svg.append("text")
        .attr("x", x(actualProportion))
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("fill", "#2E7D32")  // Dark Green
        .style("font-size", "14px")
        .text("Actual Proportion");
}

function addRect2(){
    // Data for February 1st, 14th, and 27th
    const data = [
        { date: 'February 1st', estimate: 43.15, ci_lower: 35.12, ci_upper: 51.18 },
        { date: 'February 14th', estimate: 43.38, ci_lower: 35.05, ci_upper: 51.71 },
        { date: 'February 27th', estimate: 35.98, ci_lower: 29.14, ci_upper: 42.82 }
    ];

    const actualProportion = 40.16; // Actual February proportion

    const margin = { top: 80, right: 30, bottom: 80, left: 120 },
          width = 1000 - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#rect-2")
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleLinear()
                .domain([0, 100])
                .range([0, width]);

    const y = d3.scaleBand()
                .domain(data.map(d => d.date))
                .range([0, height])
                .padding(0.4);

    // Add the x-axis with percentage labels
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x).tickFormat(d => d + "%"))
       .selectAll("text")
       .style("font-size", "14px"); // Make x-axis labels bigger

    // Add the y-axis
    svg.append("g")
       .call(d3.axisLeft(y))
       .selectAll("text")
       .style("font-size", "14px"); // Make y-axis labels bigger

    // Add the confidence intervals (horizontal lines)
    svg.selectAll(".ci-line")
       .data(data)
       .enter()
       .append("line")
       .attr("class", "ci-line")
       .attr("x1", d => x(d.ci_lower))
       .attr("x2", d => x(d.ci_upper))
       .attr("y1", d => y(d.date) + y.bandwidth() / 2)
       .attr("y2", d => y(d.date) + y.bandwidth() / 2)
       .attr("stroke", "#42A5F5")  // Blue
       .attr("stroke-width", 2);

    // Add the estimate points (circles)
    svg.selectAll(".estimate-point")
       .data(data)
       .enter()
       .append("circle")
       .attr("class", "estimate-point")
       .attr("cx", d => x(d.estimate))
       .attr("cy", d => y(d.date) + y.bandwidth() / 2)
       .attr("r", 5)
       .attr("fill", "#FF7043");  // Orange

    // Add title
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", -30)
       .attr("text-anchor", "middle")
       .style("font-size", "18px")
       .style("font-weight", "bold")
       .text("Proportion Estimates and Confidence Intervals for February");

    // Add vertical line at actual February proportion
    svg.append("line")
       .attr("class", "actual-line")
       .attr("x1", x(actualProportion))
       .attr("x2", x(actualProportion))
       .attr("y1", 0)
       .attr("y2", height)
       .attr("stroke", "#66BB6A")  // Green
       .attr("stroke-width", 2)
       .attr("stroke-dasharray", "4,4");

    // Label for the actual proportion line
    svg.append("text")
        .attr("x", x(actualProportion))
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("fill", "#2E7D32")  // Dark Green
        .style("font-size", "14px")
        .text("Actual Proportion");
}