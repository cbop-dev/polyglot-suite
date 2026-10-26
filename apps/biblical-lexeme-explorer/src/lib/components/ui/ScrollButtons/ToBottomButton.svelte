<script>
    //let arrowStyle="btn btn-circle btn-sm  btn-ghost float-end float-left   mb-3 mr-3 shadow-md font-bold text-xl h-30 v-30";
    //const arrowStyle = "btn btn-circle btn-sm   btn-ghost     mb-3 mr-3 shadow-md font-bold float-end float-left h-30 v-30 flex rounded-xl shadow-xl fixed bottom-2 left-2  ";
    const arrowStyle="btn btn-circle btn-sm      mb-3 mr-3 shadow-md font-bold fixed bottom-2 left-2 h-30 v-30 flex shadow-xl  border-red border-0 border-t-2";
  /**
   * @typedef {Object} Props
   * @property {string} [buttonText] - "⤓"   ;/*"⇧", "↑", "Back to Top";
   * @property {string} [buttonStyle]
   * @property {string} [textSize]
   * @property {any} customStyle
   * @property {any} target
   */

  /** @type {Props} */
  let {
    buttonText = "⯯",
    buttonStyle = "btn btn-circle btn-sm   btn-ghost  float-end float-left   mb-3 mr-3 shadow-md font-bold text-xl",
    textSize = "base",
    customStyle,
    target
  } = $props();
  </script>
  
  <style>
  
  </style>
  
  <!--<button  onclick={() => {window.scrollTo(0, document.body.scrollHeight)}} class="{textSize} {buttonStyle} rounded-xl shadow-xl">
    {buttonText}
  </button>-->

  
  <svg onclick={() => {window.scrollTo(0, document.body.scrollHeight)}} class="{arrowStyle} {customStyle}" target={target} version="1.1" id="Layer_1" 
    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.433 122.88" 
  enable-background="new 0 0 122.433 122.88" xml:space="preserve"><g>
    <polygon fill-rule="evenodd" clip-rule="evenodd" 
    points="61.216,122.88 0,59.207 39.403,59.207 39.403,0 83.033,0 83.033,59.207 122.433,59.207 61.216,122.88"/>
  </g></svg>