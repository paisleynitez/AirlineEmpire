/* Airline Empire v1.3.0 — Airport visual identity profiles.
 * Profiles describe recognizable geography and landmark silhouettes. The
 * renderer uses these records to create lightweight offline SVG postcards.
 */
(function(){
  'use strict';
  window.AIRPORT_VISUAL_PROFILES = {
    'New York':       {sky:['#172b50','#071322'],water:true, terrain:'flat', landmark:'liberty', skyline:'dense', accent:'#8cc8ff', climate:'coastal'},
    'Chicago':        {sky:['#27405d','#091526'],water:true, terrain:'flat', landmark:'willis', skyline:'dense', accent:'#70b8ef', climate:'continental'},
    'Los Angeles':    {sky:['#59436d','#15233b'],water:false,terrain:'mountains',landmark:'hollywood',skyline:'spread',accent:'#ffb978',climate:'dry'},
    'Dallas':         {sky:['#4a4059','#132338'],water:false,terrain:'flat', landmark:'reunion', skyline:'spread', accent:'#e8bc72', climate:'warm'},
    'Washington DC': {sky:['#263c57','#0b1727'],water:true, terrain:'flat', landmark:'monument',skyline:'low',accent:'#d8e6ef',climate:'temperate'},
    'Houston':        {sky:['#31465d','#102032'],water:false,terrain:'flat', landmark:'houston', skyline:'spread',accent:'#efc075',climate:'humid'},
    'San Francisco':  {sky:['#3d5b72','#12283b'],water:true, terrain:'hills', landmark:'golden-gate',skyline:'medium',accent:'#ef775f',climate:'coastal'},
    'Atlanta':        {sky:['#273b50','#0d1a28'],water:false,terrain:'trees', landmark:'atlanta', skyline:'medium',accent:'#d4b66e',climate:'humid'},
    'Phoenix':        {sky:['#704d53','#24243a'],water:false,terrain:'desert',landmark:'camelback',skyline:'low',accent:'#ffb24d',climate:'desert'},
    'Seattle':        {sky:['#29475c','#0c1c2b'],water:true, terrain:'mountains',landmark:'space-needle',skyline:'medium',accent:'#82d0c8',climate:'coastal'},
    'Miami':          {sky:['#2d6681','#10283b'],water:true, terrain:'palms', landmark:'miami', skyline:'medium',accent:'#7be3d5',climate:'tropical'},
    'London':         {sky:['#35445b','#111827'],water:true, terrain:'flat', landmark:'big-ben',skyline:'dense',accent:'#d7b36c',climate:'maritime'},
    'Paris':          {sky:['#56445f','#17182a'],water:true, terrain:'flat', landmark:'eiffel', skyline:'low',accent:'#f3c56c',climate:'temperate'},
    'Tokyo':          {sky:['#26385e','#0d1428'],water:true, terrain:'mountains',landmark:'tokyo-tower',skyline:'dense',accent:'#ff6f7d',climate:'humid'},
    'Dubai':          {sky:['#6a4e57','#172438'],water:true, terrain:'desert',landmark:'burj',skyline:'dense',accent:'#f0c66d',climate:'desert'},
    'Sydney':         {sky:['#2d5d7c','#10243a'],water:true, terrain:'hills', landmark:'opera', skyline:'medium',accent:'#e9eef4',climate:'coastal'},
    'Singapore':      {sky:['#24536a','#0b2230'],water:true, terrain:'tropical',landmark:'marina',skyline:'dense',accent:'#79e1c4',climate:'tropical'},
    'Toronto':        {sky:['#304b66','#0d1a2a'],water:true, terrain:'flat', landmark:'cn-tower',skyline:'dense',accent:'#9bc6ea',climate:'continental'},
    'Mexico City':    {sky:['#4b5261','#172231'],water:false,terrain:'mountains',landmark:'angel',skyline:'dense',accent:'#e6c56f',climate:'highland'},
    'Rio de Janeiro': {sky:['#38647a','#102a3c'],water:true, terrain:'mountains',landmark:'christ',skyline:'medium',accent:'#8fe4bf',climate:'tropical'}
  };
})();
