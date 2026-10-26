<script>
import { browser} from '$app/environment';
import { mylog } from '$lib/env/env.js';
import Chart from 'chart.js/auto';
import './ChartDataTypes.js';


/***
 * @typedef {Object} Props 
 * @property {BubbleData} bubbleData
 * @property {number} [maxBubbleRadius]
 * @property {Function} bubbleRadiusFunc
 * @property {string} [title]
 * @property {string} [scaleType]
 * @property {function} [onclick]
*/
/**
 * @type {Props}
 */
let { 
    bubbleData, 
    title="",
    scaleType='logarithmic',
    maxBubbleRadius=40,
    bubbleRadiusFunc=getRadius,
    onclick=(items)=>{},
} = $props();

let chartType = $state('bubble');
//let chartWidth = $state();


let myOptions = $state({
        hoverRadius: 20,
        plugins: {
            legend: {display: false},
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ": section freq. = " + context.parsed.y + " ; NT freq. = " + context.parsed.x ;
                    }
                }
            },
            
        },
        scales: {
            x: {
                type: scaleType,
                title: {
                    display: true,
                    text: "NT frequency"
                }
            },
            y: {
                type: scaleType,
                title: {
                    display: true,
                    text: "Section frequency"
                }
            }
        },
        onClick:  (e) => {
            //mylog(e);
            const thePoints = theChart?.getElementsAtEventForMode(e,'point',{ intersect: false }, false);
            //mylog(thePoints);
           // alert("Found " + (thePoints.length ? thePoints.length : " no " + " points!"));
            //mylog("BubbleChart.svelte, onClick! Points.length = " + (thePoints.length ? thePoints.length :  '0'));
            if (thePoints.length){
                const lexIDs = thePoints.map((p)=>theChart?.data.datasets[p.datasetIndex].lexID);
              //  mylog("calling callback onlick([" + thePoints.map((p)=>theChart?.data.datasets[p.datasetIndex].label) + "])");
                onclick(lexIDs);
            }

        }
    });

let type = chartType;

const data = {
    datasets: [
        {
            label: 'ἄνθρωπος',
            data: [{
                x: 20,
                y: 30,
                r: 15
            }],
            backgroundColor: 'rgb(255, 99, 132)'
        },
        {
            label: 'θεός',
            data: [{
                x: 40,
                y: 10,
                r: 10
            }],
            backgroundColor: 'rgb(99, 255, 132)'
        }

    ]
};
//let options = $derived(myOptions);
	
let config = $derived({
		type,
		data: bubbleData,
		options: myOptions
});

let theChart = null;
function handleChart(element, config) {
    //mylog("handling bubble chart...")
	    	
        theChart = new Chart(element, config)
		
		return {
			update(config) {
				theChart.destroy();
               // prepareBubbleData();
				theChart = new Chart(element, config)
			},
			destroy() {
				theChart.destroy()
			}
		}
}

/**
 * 
 * @param {number} val
 */
function getRadius(val){
        const maxRadius = maxBubbleRadius;
        const minRadius = 3;
        /*const logBase = 4;
        const logPoint = Math.pow(logBase,2);

        const logScaledVal = Math.log(logPoint * val) / Math.log(logBase) -1;*/
       // const val = val / results.sectionTotalWords;
        const scaledVal = Math.sqrt(val/maxRval);
        const radius= Math.round((maxRadius-minRadius) * scaledVal + minRadius);
        mylog("Radius calc(" + [val,maxRval,totalRvals].join(',') + "): maxRadius(" + maxRadius + ') -minRadius(' + minRadius + ')) * scaledVal(' 
            + scaledVal + ') + minRadius(' +minRadius + ')) = ' + radius);
        return radius;
    }
mylog(bubbleData)
const maxRval = $derived(bubbleData.datasets.reduce((a,b)=> a >  b.data[0].rVal  ? a : b.data[0].rVal,0));
mylog("MaxRVal = " +maxRval)
const totalRvals = $derived(bubbleData.datasets.reduce((a,b)=> a + b.data[0].rVal,0));
mylog("totalRvals = " +totalRvals);

function prepareBubbleData(){
    bubbleData.datasets.forEach((ds,i)=>{
        bubbleData.datasets[i].data[0].r = bubbleRadiusFunc(ds.data[0].rVal)

    })
}
//prepareBubbleData();
</script>
{#if title}
<h3>{title}</h3>
{/if}
<canvas use:handleChart={config}

></canvas>