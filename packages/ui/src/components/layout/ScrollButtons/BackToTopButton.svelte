<script>
    const arrowStyle="btn btn-circle btn-sm      mb-3 mr-3 shadow-md font-bold   h-30 v-30 shadow-xl  border-red border-0 border-t-2";
  /**
   * @typedef {Object} Props
   * @property {string} [buttonText] - "⌃"   ;/*"⇧", "↑", "Back to Top";
   * @property {string} [buttonStyle]
   * @property {string} [textSize]
   * @property {any} [customStyle]
   */

  /** @type {Props} */
  let {
    buttonText = "⯭",
    buttonStyle = "btn  btn-sm  btn-ghost    mb-3 mr-3 shadow-md font-bold text-xl",
    textSize = "base",
    customStyle=''
  } = $props();
  </script>
  
  <style>
  
  </style>
  
 <!-- <button  onclick={() => {document.body.scrollTop = 0;  document.documentElement.scrollTop = 0;}} class="{textSize} rounded-xl shadow-xl {buttonStyle} ">
    {buttonText}
  </button>-->
  
  <svg onclick={() => {document.body.scrollTop = 0;  document.documentElement.scrollTop = 0;}} 
    class="{arrowStyle} {customStyle}" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" 
    xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" 
    viewBox="0 0 122.433 122.88" enable-background="new 0 0 122.433 122.88" xml:space="preserve"><g>
    <polygon fill-rule="evenodd" clip-rule="evenodd" points="61.216,0 0,63.673 39.403,63.673 39.403,122.88 83.033,122.88 83.033,63.673 122.433,63.673 61.216,0"/>
  </g></svg>

