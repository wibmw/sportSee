import * as d3 from 'd3'
import { useEffect, useState, useRef } from 'react'
import { IAverageSessions, Size } from '../../../api/Interfaces'
import { createSVG, svgGroups, svgXScale } from '../../../utils/d3Tools'
import { vw } from '../../../utils/responsive'

const LineChart = (props: { session: IAverageSessions[] }) => {
  // SVG container
  const lineContainerRef = useRef<HTMLHeadingElement>(null),
    // ref for resize event
    updateWidth = useRef(false),
    // The size of the window
    [size, setSize] = useState<Size>(),
    // Get Responsive width
    svgHeight = vw(16),
    svgWidth = vw(16),
    // Container margin
    margin = { top: 35, left: 20, right: 20, bottom: 35 }

  useEffect(() => {
    // If re-render, remove the previous chart
    updateWidth.current ? document?.querySelector('.line_chart')?.remove() : (updateWidth.current = true)
    // Draw the chart
    DrawChart(props.session)
    // Listening for the window resize event
    window.addEventListener('resize', resizeHanlder)
    // Remove the event listener when the component is unmounted
    return () => {
      window.removeEventListener('resize', resizeHanlder)
    }
  }, [props.session, size])

  // This function updates the state to re-render components
  const resizeHanlder = () => {
    setSize({ width: window.innerWidth, height: window.innerHeight })
  }

  const DrawChart = (session: IAverageSessions[]) => {
    // Chart size
    const graphWidth = parseInt(d3.select(lineContainerRef.current).style('width')) - margin.left - margin.right
    const graphHeight = parseInt(d3.select(lineContainerRef.current).style('height')) - margin.top - margin.bottom
    // Create the SVG container
    const svg = createSVG(lineContainerRef.current, 'line_chart', svgWidth, svgHeight)

    // Add a title
    svg
      .append('text')
      .attr('fill', '#fff')
      .attr('x', margin.right)
      .attr('y', margin.top)
      .text('Durée moyenne des sessions')
      .attr('class', 'legends')
    // X Scales
    const xScale = svgXScale([1, 7], [1, svgWidth - 3])
    const xScaleAxis = svgXScale([1, 7], [15, svgWidth - 15])
    // Week Days list
    const week = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    // X axis
    const xAxis = d3
      .axisBottom(xScaleAxis)
      .tickSize(0)
      .ticks(7)
      .tickFormat((d, i) => week[i].substring(0, 1))
    // Y axis
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(session, (d) => d.sessionLength)] as number[])
      .range([graphHeight, margin.top + margin.bottom])
    // Add WeekDays to the X axis
    svg
      .append('g')
      .call(xAxis)
      .attr('transform', `translate(0, ${graphHeight + margin.top - 10})`)
      .attr('class', 'legends')
      .select('.domain')
      .remove()

    // Draw sessions lines
    session.forEach((d, index) => {
      // Line Curve
      const line = d3
        .line<IAverageSessions>()
        .x((data) => xScale(data.day))
        .y((data) => yScale(data.sessionLength))
        .curve(d3.curveBumpX)
      // Line Path
      const path = svg
        .append('path')
        .attr('d', line(session))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
      // Draw Animation
      const pathLength = path?.node()?.getTotalLength() || 0
      path
        .attr('stroke-dashoffset', pathLength)
        .attr('stroke-dasharray', pathLength)
        .transition()
        .duration(1500)
        .attr('stroke-dashoffset', 0)
        .ease(d3.easeSin)

      // Tooltip Groups
      const group = svg.append('g').attr('id', 'day' + index + 'average'),
        // Session length
        length = session[index].sessionLength,
        // Group position (x axis)
        index1 = index + 1
      //  Transparent Section
      svgGroups(group, 'rect', xScale(index1), 0, '100%', svgHeight, '', 't--transparent', 0)
      // White rectangle
      svgGroups(group, 'rect', displayTooltip(index1), yScale(length) - 25, 50, 20, '', 't--white', 0)
      // Session duration
      svgGroups(group, 'text', displayTooltip(index1) + 25, yScale(length) - 10, '', '', length + 'min', 't--text', 0)
      // Opac circle
      svgGroups(group, 'circle', xScale(index1), yScale(length), 4, '', '', 't--white', 0)
      // Transparent circle
      svgGroups(group, 'circle', xScale(index1), yScale(length), 10, '', '', 't--lowOpacity', 0)

      // Add Hover event on the area
      svg
        .append('rect')
        .attr('x', xScale(index1))
        .attr('y', 0)
        .attr('width', graphWidth / 7)
        .attr('height', 300)
        .attr('fill', 'transparent')
        .attr('opacity', '1')
        // make it appear on hover + make the infos appears
        .on('mouseover', function () {
          d3.selectAll(`#day${index}average > *`).transition().attr('opacity', '1')
          d3.selectAll(`#day${index}average > .low-opacity-circle`).transition().attr('opacity', '.3')
        })
        .on('mouseout', function () {
          d3.selectAll(`#day${index}average > *`).transition().attr('opacity', '0')
        })
    })
    // Just to be sure the last tooltip don't go outside the chart
    function displayTooltip(index: number) {
      if (xScale(index) <= graphWidth - margin.left - margin.right) return xScale(index)
      else return xScale(index) - margin.left - margin.right
    }
  }

  return <div ref={lineContainerRef}></div>
}

export default LineChart
