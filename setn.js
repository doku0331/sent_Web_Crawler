// 載入需要的模組，並設定取用名稱
const fetch = require("node-fetch");
const HTMLParser = require("node-html-parser");
const fs = require("fs");
const { connected } = require("process");

var page = 1;
// 設定目標網址
var url = "https://www.setn.com/ViewAll.aspx?p=";


/////////程式開始點/////////////////
fs.writeFile("result.json", "", function(err) {
  if (err) throw err;
  console.log("把現有的json檔案吃掉了><");
});
var alldata=[];
console.log("開始幫你看看昨天的新聞，等等我喔主人><")
// 抓取 url 網頁的時間
fetch(url)
  .then(res => res.text())
  .then(body => HTMLParser.parse(body))    
  .then((domRoot) => extractTime(domRoot));

//////////////////////////////////

function getLastDateString(){
  var ts = Math.round(Date.now());
  var tsLateDate= ts -(86400000); //取得前一天的秒數
  var dLastHour = new Date(tsLateDate);
  
  var dateString = 
    ("0"+(dLastHour.getMonth()+1)).slice(-2)+"/"+
    ("0"+dLastHour.getDate()).slice(-2)+" "+
    ("0"+dLastHour.getHours()).slice(-2)+":"+
    ("0"+dLastHour.getMinutes()).slice(-2);
  
    return dateString;
  
}

//解析網頁獲得時間 並遞迴直到正確頁數
function extractTime(root) {
  var elem, endtime;
  var nodes = root.querySelectorAll('div.NewsList div.col-sm-12');
  var lastdate = getLastDateString();
  
  elem = nodes[(nodes.length-1)].querySelector('time');
  endtime = elem.rawText.trim();// 最後一篇新聞的時間

  if(endtime.substring(3,5)==lastdate.substring(3,5)){ 
    console.log("找到了前一天的新聞出現在第"+page+"頁了，這裡開始要抓喔><");
    getnextpage(url,page);
    return
  }else{
    page++;
    console.log("現在正在確認第"+page+"頁喔>//<");
    fetch(url+page)
      .then(res => res.text())
      .then(body => HTMLParser.parse(body))    
      .then((domRoot) => extractTime(domRoot));
  }
}

//抓到page內的東西
function getWebElement(url,page){
  // 抓取 url 網頁
  fetch(url+page)
  .then(res => res.text())
  .then(body => HTMLParser.parse(body))    
  .then((domRoot) => extractData(domRoot));
}

function getWebElementfinal(url,page){
  // 抓取 url 網頁
  fetch(url+page)
  .then(res => res.text())
  .then(body => HTMLParser.parse(body))    
  .then((domRoot) => extractDatafinal(domRoot))
}

function getnextpage(url,page){
  fetch(url)
  .then(res => res.text())
  .then(body => HTMLParser.parse(body))    
  .then((domRoot) => extractNext(domRoot));
}
  
// 解析網頁，取得標題與網址，儲存頁面中前一天的所有新聞
function extractData(root) {
  console.log("當前抓的是"+page+"頁，人家會努力的");
  var elem, title;
  var objs = [];
  var nodes = root.querySelectorAll('div.NewsList div.col-sm-12');
  var timeElem
  var lastdate = getLastDateString();
  
  for (i = 0; i < nodes.length; i++) {
    elem = nodes[i].querySelector('h3 a');
    title = elem.rawText.trim();        // 取得元素文字
    thisUrl = elem.getAttribute('href') // 取的元素href值
    
    timeElem = nodes[i].querySelector('time');
    time = timeElem.rawText.trim();// 當前新聞的時間
    
    
    tagElem = nodes[i].querySelector('div a');
    tag = tagElem.rawText.trim();// 當前新聞的tag

    // 篩選需要的網址, 以JSON物件儲存
    if (thisUrl) {
      if(time.substring(3,5)==lastdate.substring(3,5)){
        
        if(thisUrl.includes("https")){
          objs.push({ "時間":time ,"標籤":tag, "標題": title, "URL": thisUrl }); 
        }
        else{
          let trueUrl = "https://www.setn.com"+thisUrl;
          objs.push({ "時間":time ,"標籤":tag,  "標題": title, "URL": trueUrl }); 
        }
      } 
    } 
  }
  //console.log(objs);
  //console.log( JSON.stringify(objs) );

  alldata.push(objs);//先放入alldata等待處理
  console.log("現在這樣長"+alldata.length);
  console.log("這次抓到"+objs.length+"筆");
  /*
  // 儲存json
  fs.appendFile("setn-news.json", JSON.stringify(objs), function(err) {
    if (err) throw err;
    console.log("成功抓到第"+page+"頁屬於前一天的內容了!!");
  });
  */
}


//解析網頁獲得時間 並遞迴直到正確頁數
function extractNext(root) {
  var elem, endtime;
  var nodes = root.querySelectorAll('div.NewsList div.col-sm-12');
  var lastdate = getLastDateString();
  
  elem = nodes[(nodes.length-1)].querySelector('time');
  endtime = elem.rawText.trim();// 最後一篇新聞的時間

  if(endtime.substring(3,5)==(lastdate.substring(3,5)-1)){ 
    console.log(endtime.substring(3,5));
    getWebElementfinal(url,page);
    console.log("找到了前兩天的新聞出現在第"+page+"頁!!!，停下來");
    console.log("主人我幫你找到所有前一天的新聞了 摸摸頭><")
    
    return
  }else{
    console.log("準備抓第"+page+"頁的資料><")
    getWebElement(url,page);
    page++;
    console.log("現在正在確認第"+page+"頁最後一則新聞是不是前兩天的新聞喔><");
    fetch(url+page)
      .then(res => res.text())
      .then(body => HTMLParser.parse(body))    
      .then((domRoot) => extractNext(domRoot));
  }
  
}


//處理json
function dealwithjson(alldata){
  var result=[];
  var tag= [];
  var articals=[];
  for(let i=0;i<alldata.length; i++){
    for(let j=0; j<alldata[i].length; j++){
      if(tag.indexOf(alldata[i][j].標籤)==-1){
        tag.push(alldata[i][j].標籤);
        articals.push([]);
      }
    }
  }
  for(let i=0;i<alldata.length; i++){
    for(let j=0; j<alldata[i].length; j++){
      alldata[i][j]
      indexOftag = tag.indexOf(alldata[i][j].標籤);
      if(indexOftag!=-1){
        articals[indexOftag].push(
          { "topic": alldata[i][j].標題,
				    "date": alldata[i][j].時間,
            "url": alldata[i][j].URL
          }
        )
      }else{
        console.log("警告，儲存出錯了，未知的標籤")
      }
    }
  }
  for(let i=0;i<articals.length;i++){
    result.push(
      {
        "tag": tag[i],
        "count": articals[i].length,
        "articles": articals[i]
      }
    )
  }
  
    fs.appendFile("result.json", JSON.stringify(result), function(err) {
      if (err) throw err;
      console.log("成功整理好了，可以去看看");
    });

  
}


function extractDatafinal(root) {
  console.log("當前抓的是"+page+"頁，人家會努力的");
  var elem, title;
  var objs = [];
  var nodes = root.querySelectorAll('div.NewsList div.col-sm-12');
  var timeElem
  var lastdate = getLastDateString();
  
  for (i = 0; i < nodes.length; i++) {
    elem = nodes[i].querySelector('h3 a');
    title = elem.rawText.trim();        // 取得元素文字
    thisUrl = elem.getAttribute('href') // 取的元素href值
    
    timeElem = nodes[i].querySelector('time');
    time = timeElem.rawText.trim();// 當前新聞的時間
    
    
    tagElem = nodes[i].querySelector('div a');
    tag = tagElem.rawText.trim();// 當前新聞的tag

    // 篩選需要的網址, 以JSON物件儲存
    if (thisUrl && thisUrl.includes("News") ) {
      if(time.substring(3,5)==lastdate.substring(3,5)){
        
        if(thisUrl.includes("https")){
          objs.push({ "時間":time ,"標籤":tag, "標題": title, "URL": thisUrl }); 
        }
        else{
          let trueUrl = "https://www.setn.com"+thisUrl;
          objs.push({ "時間":time ,"標籤":tag,  "標題": title, "URL": trueUrl }); 
        }
      } 
    } 
  }
  //console.log(objs);
  //console.log( JSON.stringify(objs) );

  alldata.push(objs);//先放入alldata等待處理
  console.log("現在這樣長"+alldata.length);
  console.log("這次抓到"+objs.length+"筆");
  dealwithjson(alldata);
  console.log("最後 ，抓到第"+page+"頁屬於前一天的內容了!!");

  /*
  // 儲存json
  fs.appendFile("setn-news.json", JSON.stringify(objs), function(err) {
    if (err) throw err;
  });
  */
}