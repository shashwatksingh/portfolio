var navMenuAnchorTags = document.querySelectorAll('.nav-menu a');
for (let i = 1; i < navMenuAnchorTags.length; i++) {
  navMenuAnchorTags[i].addEventListener('click', function(event) {
    event.preventDefault();
    var targetSectionID = this.textContent.trim().toLowerCase();
    var hashvalue = this.hash;
    var targetSection = document.getElementById(targetSectionID);
    var interval = setInterval(function() {
      var targetSectionCoordinates = targetSection.getBoundingClientRect();
      if (targetSectionCoordinates.top <= 0 || targetSection == 'contact') {
        clearInterval(interval);
        return;
      }
      window.scrollBy(0, 50);
    }, 30);
  });
}
var progressBars = document.querySelectorAll('.outerbox > div');
var skillsContainer = document.getElementById('skills-content');
var last = 0;
var updateIndex = 0;
var ctr = 0;
  var coordinaatesSkillsContent = skillsContainer.getBoundingClientRect();
window.addEventListener('scroll', checkScroll);

function initialiseBars() {
  for (let bar of progressBars) {
    bar.style.width = 0 + "%";
  }
}
initialiseBars();

/*function initialiseBar(bar) {
  bar.style.width = 0 + "%";
}*/
function whichToBeUpdated(n) {
  if (last==6){
    ctr++;
  }
  let indexes = n - 1;
  if (last < indexes) {
    updateIndex = indexes - last;
    fillBar(updateIndex);
  } else if (ctr>0 && indexes==-1) {
    //updateIndex = last - indexes;
    console.log("inside refresh");
    initialiseBars();
    ctr=0;
    last=0;
  }
}

function fillBar(n) {
  for (let i = 0; i <= n; i++) {
    let bar = progressBars[last];
    let targetWidth = bar.getAttribute('data-bar-width');
    let currentWidth = 0;
    let interval = setInterval(function() {
      if (currentWidth > targetWidth) {
        clearInterval(interval);
        return;
      }
      currentWidth++;
      bar.style.width = currentWidth + "%";

    }, 15);
    last++;
  }
}
//function allVisible()
function checkScroll() {
  var visiNum = 0;
  for (let i = 0; i < progressBars.length; i++) {
    let bars = progressBars[i];
    var coordinates = bars.getBoundingClientRect();

    //console.log(coordinates);
    var animDone = false;
    if (animDone == false && coordinates.top < window.innerHeight-100) {
      visiNum += 1;
      animDone = true;
    }
  }
  whichToBeUpdated(visiNum);
}
/*function initialiseBars(){
  for (let bar of progressBars){
    console.log(bar);
    bar.style.width = 0+"%";
  }
}
initialiseBars();
function fillBars(){
  for (let bar of progressBars){
    let targetWidth = bar.getAttribute('data-bar-width');
    let currentWidth = 0;
    let interval = setInterval(function(){
      if(currentWidth>targetWidth){
        clearInterval(interval);
        return;
      }
      currentWidth++;
      bar.style.width = currentWidth + "%";

    },15);
  }

}
function checkScroll(){
  var coordinaatesSkillsContent = skillsContainer.getBoundingClientRect();
  if(animDone==false && coordinaatesSkillsContent.top < window.innerHeight){
    console.log("skills visible");
    fillBars();
    animDone=true;
  }
  else if(coordinaatesSkillsContent.top > window.innerHeight){
    animDone=false;
    initialiseBars();
  }
}*/
