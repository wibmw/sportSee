import * as d3 from 'd3'
import { useEffect, useState, useRef } from 'react'
import { IAverageSessions, Size } from '../api/Interfaces'
import {vh, vw} from '../utils/responsive'

const LineChart = (props: { session: IAverageSessions[] }) => {
  // svg parent ref
  const lineContainerRef = useRef<HTMLHeadingElement>(null)
  // ref for resize event
  const updateWidth = useRef(false)
  // responsive width
  // The size of the window
  const [size, setSize] = useState<Size>()


  // responsive width
  const svgHeight = vw(16),
    svgWidth = vw(16),
    margin = { top: 35, left: 20, right: 20, bottom: 35 }

  useEffect(() => {
    // if resize remove the previous chart
    updateWidth.current ? document?.querySelector('.line-chart-svg')?.remove() : (updateWidth.current = true)
    // re-draw the chart with new dimensions after resize
    DrawChart(props.session)
    // Listening for the window resize event
    window.addEventListener('resize', resizeHanlder)
    // Remove the event listener when the component is unmounted
    return () => {
      window.removeEventListener('resize', resizeHanlder)
    }
  }, [props.session, size])

  // This function updates the state thus re-render components
  const resizeHanlder = () => {
    setSize({ width: window.innerWidth, height: window.innerHeight })
  }

  const DrawChart = (session: IAverageSessions[]) => {
    // dimentions
    const graphWidth =
      parseInt(d3.select(lineContainerRef.current).style('width')) - margin.left - margin.right
    const graphHeight =
      parseInt(d3.select(lineContainerRef.current).style('height')) - margin.top - margin.bottom
    // create new chart
    const svg = d3
      .select(lineContainerRef.current)
      .append('svg')
      .classed('line-chart-svg', true)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .style('background-color', '#FF0000')
      .style('border-radius', '5px')
    // add a title
    svg
      .append('text')
      .attr('fill', '#fff')
      .attr('x', margin.right)
      .attr('y', margin.top)
      .text('Durée moyenne des sessions')
      .attr('class', 'legends')
    // X axis
    const xScale = d3
      .scaleLinear()
      .domain([1, 7])
      .range([1, svgWidth - 3])
    const xScaleAxis = d3
      .scaleLinear()
      .domain([1, 7])
      .range([15, svgWidth - 15])
    const week = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    // const tickLabels = session.map((d, i) => d.day)
    const xAxis = d3
      .axisBottom(xScaleAxis)
      .tickSize(0)
      .ticks(7)
      .tickFormat((d, i) => week[i].substring(0, 1))

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(session, (d) => d.sessionLength)] as number[])
      .range([graphHeight, margin.top + margin.bottom])

    svg
      .append('g')
      .call(xAxis)
      .attr('color', '#fff')
      .attr('transform', `translate(0, ${graphHeight + margin.top - 10})`)
      .attr('class', 'legends')
      .attr('margin-left', '20px')
      .select('.domain')
      .remove()

    // lines
    session.forEach((d, index) => {
      // path
      const line = d3
        .line<IAverageSessions>()
        .x((data) => xScale(data.day))
        .y((data) => yScale(data.sessionLength))
        .curve(d3.curveMonotoneX)

      const path = svg
        .append('path')
        .attr('d', line(session))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('fill', 'none')

      // animation
      const pathLength = path?.node()?.getTotalLength() || 0
      path
        .attr('stroke-dashoffset', pathLength)
        .attr('stroke-dasharray', pathLength)
        .transition()
        .duration(1500)
        .attr('stroke-dashoffset', 0)
        .ease(d3.easeSin)

      // Dots Tooltip
      const groups = (
        type: string,
        x: number,
        y: number,
        width: string | number,
        height: string | number,
        className?: string,
        text?: string,
      ) => {
        group
          .append(type)
          .attr(type === 'circle' ? 'cx' : 'x', x)
          .attr(type === 'circle' ? 'cy' : 'y', y)
          .attr('width', width)
          .attr('height', height)
          .attr('class', className || '')
          .text(text || '')
          .attr('r', type === 'circle' ? width : 0)
          .attr('opacity', '0')
      }

      const group = svg.append('g').attr('id', 'day' + index + 'average')
      const length = session[index].sessionLength
      const index1 = index + 1
      groups('rect', xScale(index1), 0, '100%', graphHeight + margin.top + margin.bottom, 't--transparent')
      groups('rect', displayTooltip(index1), yScale(length) - 25, 50, 20, 't--white')
      groups('text', displayTooltip(index1) + 25, yScale(length) - 10, '', '', 't--text', length + 'min')
      groups('circle', xScale(index1), yScale(length), 4, '', 't--white')
      groups('circle', xScale(index1), yScale(length), 10, '', 't--lowOpacity', '')

      // hover area
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
    // Just to be sure a tooltip don't go outside the chart
    function displayTooltip(index: number) {
      if (xScale(index) <= graphWidth - margin.left - margin.right) return xScale(index)
      else return xScale(index) - margin.left - margin.right
    }
  }

  return (
    <div
      className='line_chart' // add a class for styling
      ref={lineContainerRef}
      style={{ height: svgHeight }}
    ></div>
  )
}

export default LineChart
