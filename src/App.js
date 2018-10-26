import React, { Component, TimeUnit } from 'react';
import ReactDOM from "react-dom";
import { Link, withRouter } from 'react-router-dom';
import ReactGA from "react-ga";
import history from './history';

import "./index.css";

import logo from "./kanjigridlogo.svg";
import cog from "./settings.svg";
import check from "./check-circle.svg";
import './App.css';

import {kanji} from "./strings";
import kanjijson from "./kanjidata.json";


import PerfectScrollbar from 'perfect-scrollbar';
import "./perfect-scrollbar.css"


class App extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      progress: 0,
      step: 0,
      selectedkanji: -1,
      highlights: {},
      query: "",
      fontstyle: 0,
      noborder: false,
      tab: 0,
      settingsopen: false,
    };
    if(props.match.params.kanji){
      var kanjiRoute = parseInt(props.match.params.kanji);
      if(kanjiRoute >= 1 && kanjiRoute <= 2200)
        this.state.selectedkanji = props.match.params.kanji-1;
    }

    this.kanjidict = {};
    this.radicaldict = {};
    this.psyomi = null;
    this.psvocab = null;
    this.psradical = null;

    this.kanji = kanji.split(" ");
    this.kanjiblocks = new Array(10);
    for(var i = 0; i < 10; i++){
      this.kanjiblocks[i] = new Array(220);
      for(var ii = 0; ii < 220; ii++){
        this.kanjiblocks[i][ii] =  this.kanji[((i)*220)+ii];
      }
    }

    var startprogress = window.localStorage.getItem('refCount');
    var step = window.localStorage.getItem('refStep');
    var date = new Date(window.localStorage.getItem('refDate'));

    if(step == null)
      step = 0;

    var curdate = new Date();

    var deltams = new Date(curdate.getTime() - date.getTime());
    var deltadays = Math.floor(deltams / (24*60*60*1000));;

    /*console.log("refDate: " + date);
    console.log("curDate: " + curdate);
    console.log("deltaDays: " + deltadays);*/

    var curprogress = parseInt(startprogress) + (deltadays*step);
    if(isNaN(curprogress))
      curprogress = 0;

    this.state.progress = curprogress;
    this.state.step = step;

    if(step == 0 && curprogress == 0)
      this.state.settingsopen = true;

    this.updateDimensions = this.updateDimensions.bind(this);
    this.renderInfo = this.renderInfo.bind(this);
    this.searchInput = this.searchInput.bind(this);
    this.progressInput = this.progressInput.bind(this);
    this.stepInput = this.stepInput.bind(this);

    this.parseRtkJson();
  }

  saveProgress(progress,step){

    var curdate = new Date();
    var curdatestring = curdate.toLocaleDateString();

    window.localStorage.setItem('refDate', curdatestring);
    window.localStorage.setItem('refCount', progress);
    window.localStorage.setItem('refStep', step);

  }


  parseRtkJson(){
    for(var i = 0; i < kanjijson.length; i++){
      var symbol = kanjijson[i][1];

      //DICT
      this.kanjidict[symbol] = new Array();
      var keyarray = [kanjijson[i][0]];
      var comps = keyarray.concat(kanjijson[i][5]);
      this.kanjidict[symbol].push(comps);
      this.kanjidict[symbol].push(kanjijson[i][2]);
      this.kanjidict[symbol].push(kanjijson[i][3]);
      this.kanjidict[symbol].push(kanjijson[i][4]);

      var constarray = comps;
      for(var ii = 0; ii < constarray.length; ii++){
        if(constarray[ii] != ""){
          if(!this.radicaldict[constarray[ii]]){
            this.radicaldict[constarray[ii]] = new Array();
          }
          this.radicaldict[constarray[ii]].push(symbol);
        }
      }

    }
  }


  componentDidMount(){
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions);
  }

  updateDimensions(){
     this.setState({width: window.innerWidth, height: window.innerHeight});
  }


  onClick(i){
    this.setState({selectedkanji: i});
    history.push("/"+(i+1));
  }

  radicalClick(radical){
    this.setState({query: radical})
    this.inputChanged(radical);

    ReactGA.event({
        category: 'Input',
        action: "Radical Click",
        label: radical,
    });
  }

  fontClick(){
    this.setState({fontstyle: 1 - this.state.fontstyle});
  }

  renderRadicals(radical, index){
    var radical = radical.toLowerCase();
    return(
      <div className="radical" key={index} onClick={()=>this.radicalClick(radical)}>{radical}</div>
    );
  }

  componentDidUpdate(){
    const containeryomi = document.querySelector('.kunyomi.container');
    const containervocab = document.querySelector('.vocabcontainer');
    const containerradicals = document.querySelector('.radicalcontainer');
    if(this.psyomi)
      this.psyomi.destroy();
    if(this.psvocab)
      this.psvocab.destroy();
    if(this.psradical)
      this.psradical.destroy();
    this.psyomi = null;
    this.psvocab = null;
    this.psradical = null;
    if(containeryomi)
      this.psyomi = new PerfectScrollbar(containeryomi);
    if(containervocab)
      this.psvocab = new PerfectScrollbar(containervocab);
    if(containerradicals)
      this.psradical = new PerfectScrollbar(containerradicals);
  }

  renderYomi(yomi, classname){
    var title = "On'Yomi";
    if(classname == "kunyomi")
      title = "Kun'Yomi";
    if(this.state.noborder)
      classname = classname + " noborder";

    if(yomi.length > 0 && yomi[0].length > 0){
      this.state.noborder = false;
      return(
        <div className={classname}>
          {title}<br></br>
          <div className={classname + " container"}>
            {yomi.map((yomi,i) =><div className="yomi" key={i}>{yomi}</div>)}
          </div>
        </div>
      );
    }
    else{
        this.state.noborder = true;
    }
  }



  logJishoClick(word){
    ReactGA.event({
        category: 'Interaction',
        action: "Jisho Link Clicked",
        label: word,
    });
  }

  renderVocab(vocab){
    var novocab = "";
    if(vocab.length == 0)
      novocab = "No words found, sorry. :(";

    return(
      <div className="vocab">
      <div className="vocabfade"></div>
      <div className="vocabcontainer">
        <div>{novocab}</div>
        {vocab.map((vocab,i) =>
          <a  target="_blank" onClick={()=>this.logJishoClick(vocab[0])} key={i} href={"https://jisho.org/word/" + vocab[0]}><div className="word">
            <div className="wordkana">{vocab[1]}</div>
            <div className="wordkanji">{vocab[0]}</div>
            {vocab[2].map((meaning,i) =>
              <div className="wordmeanings" key={i}>{meaning}</div>
            )}
          </div></a>)}
          <div className="radicalpadding"></div>
      </div>
      </div>
    )
  }

  tabClick(tab){
    this.setState({tab: tab});
  }
  renderTabs(){
    var classnames = ["tabbutton", "tabbutton"];
    classnames[this.state.tab] = "tabbutton active";
    var indicator = "";
    if(this.state.tab == 1)
      indicator = " indicatorright";


    return(
      <div className="tabs">
        <div className={classnames[0]} onClick={()=>this.tabClick(0)}>Readings</div>
        <div className={classnames[1]} onClick={()=>this.tabClick(1)}>Words</div>
        <div className={"tabindicator" + indicator}></div>
      </div>
    );
  }

  renderInfo(){

    if(this.state.selectedkanji != -1){
      var symbol = this.kanji[this.state.selectedkanji].toLowerCase();
      var keyword = this.kanjidict[symbol][0][0];
      var onyomi = this.kanjidict[symbol][1];
      var kunyomi = this.kanjidict[symbol][2];
      var vocab = this.kanjidict[symbol][3];
      var radicals = this.kanjidict[symbol][0].slice(1);
      var fontclass = "";
      var fontclassbut = "";
      if(this.state.fontstyle == 0)
        fontclassbut = " sans";
      if(this.state.fontstyle == 1)
        fontclass = " sans";

      var tabslide = "";
      if(this.state.tab == 1)
        tabslide = " slideright";
      return(
        <div className="info">
          <div className={"fontbutton" + fontclassbut} onClick={()=>this.fontClick()}>{symbol}</div>
          <div className={"symbol" + fontclass}>{symbol}</div>
          <div className="keyword">{keyword}</div>
          <hr></hr>
          <div className="radicalfade"></div>
          <div className="radicalcontainer">
            {radicals.map((radical, index) => this.renderRadicals(radical, index))}
            <div className="radicalpadding"></div>
          </div>
          {this.renderTabs()}
          <div className="tabcontent">
            <div className={"tabslide"+tabslide}>
              <div className="yomicontainer">
                {this.renderYomi(onyomi,"onyomi")}
                {this.renderYomi(kunyomi,"kunyomi")}
              </div>
              {this.renderVocab(vocab)}
            </div>
          </div>
        </div>
      );
    }
  }

  renderKanji(kanji, i, fontsize){
    return(
      <Kanji kanji={kanji} i={i} highlights={this.state.highlights[kanji]} progress={this.state.progress} fontsize={fontsize} key={i} onClick={()=>this.onClick(i)}></Kanji>
    )
  }

  renderKyou(){
    var kyoukanji = this.kanji.slice(this.state.progress,this.state.progress+parseInt(this.state.step));
    if(kyoukanji.length>0){
    return(
      <div className="kyou">
        <div className="title small">today</div>
        <div className="title">
        今日
        </div>
        {kyoukanji.map((kanji, index) => this.renderKanji(kanji, this.state.progress+index,24))}
      </div>
    );
    }
    else{
      return(
        <div></div>
      );
    }
  }


  inputChanged(searchstring){

    this.state.query = undefined;
    this.state.highlights = {};



    if(this.kanjidict[searchstring]){
      this.state.highlights[searchstring] = true;
      this.setState({highlights: this.state.highlights});
      return;
    }

    var radicals = this.findValueByPrefix(this.radicaldict, searchstring);

    if(searchstring && radicals.length > 0){
      for(var i = 0; i < radicals.length; i++){
        var results = this.radicaldict[radicals[i]];
        for(var ii = 0; ii < results.length; ii++){
          this.state.highlights[results[ii]] = true;
        }
      }
    }
    this.setState({highlights: this.state.highlights});
  }

  searchInput(input){
    var searchstring = input.target.value;
    this.inputChanged(searchstring);

    if(searchstring.length > 2){
      ReactGA.event({
          category: 'Input',
          action: "Search",
          label: searchstring,
      });
    }

  }
  findValueByPrefix(object, prefix) {
    prefix = prefix.toLowerCase();
    var properties = Array();
    for (var property in object) {
      if (object.hasOwnProperty(property) &&
         property.toString().toLowerCase().startsWith(prefix)) {
           properties.push(property);
      }
    }
    return properties;
  }

  renderKanjiBlock(block, i){
    return(
      <div className="kanjiblock" key={i}>
        {block.map((kanji, index) => this.renderKanji(kanji, (i*220)+index,10.9))}
      </div>
    );
  }

  renderSearch(){
    if(this.state.query){
      return(
        <input placeholder="Search..."  value={this.state.query} className="inputsearch" onInput={this.searchInput}></input>
      );
    }
    else{
      return(
        <input placeholder="Search..."  className="inputsearch" onInput={this.searchInput}></input>
      );
    }
  }

  confirmSettings(){
    ReactGA.event({
        category: 'Settings',
        action: "Progress",
        value: parseInt(this.state.progress),
    });
    ReactGA.event({
        category: 'Settings',
        action: "Step",
        value: parseInt(this.state.step),
    });

    this.toggleSettings();
  }

  toggleSettings(){
    this.setState({settingsopen: !this.state.settingsopen});
  }

  progressInput(input){
    var value = parseInt(input.target.value);
    if(value < 0)
      value = 0;
    if(value > 2200)
      value = 2200;
    if(isNaN(value))
      value = 0;
    this.setState({progress: value});
    this.saveProgress(value, this.state.step);
  }
  stepInput(input){
    var value = parseInt(input.target.value);
    if(value < 0)
      value = 0;
    if(value > 2200)
      value = 2200;
    if(isNaN(value))
      value = 0;
    this.setState({step: value});
    this.saveProgress(this.state.progress, value);
  }

  renderSettings(){
    //CONVERT TO STRING IN ORDER TO PREVENT UGLY LEADING ZEROS
    var progress = this.state.progress.toString();
    var step = this.state.step.toString();
    return(
      <div>
        <div className="settingsbar">
          <div className="settingstext">I already know</div>
          <input type="number" min="0" max="2200" value={progress}  onInput={this.progressInput} className="numberinput"></input>
          <div className="settingstext">Kanji</div>
          <br></br>
          <div className="settingstext">and am learning</div>
          <input type="number" min="0" max="100" value={step}  onInput={this.stepInput} className="numberinput"></input>
          <div className="settingstext">new Kanji every day.</div>
          <img className="settingscheck" src={check} onClick={()=>this.confirmSettings()}></img>
        </div>
      </div>
    );

  }

  logMinosClick(){
    ReactGA.event({
        category: 'Interaction',
        action: "Minos Link Clicked",
    });
  }
  renderMinos(){
    return(
      <div className="minoscontainer">
        <div className="clip_circle">
          <div className="minosinfo">made by minos</div>
        </div>
        <a href="https://github.com/minosvasilias" onClick={()=>this.logMinosClick()} target="_blank"><img className="minos" src="https://avatars1.githubusercontent.com/u/44006014?s=460&v=4"></img></a>
      </div>
    );
  }
  render() {
    var rightcontent;
    if(this.state.settingsopen){
      rightcontent = this.renderSettings();
    }else{
      rightcontent = this.renderKyou();
    }


    var scale = scale = Math.min(this.state.width/1300, this.state.height/800);

    return (
      <div className="App">
        <div className="box" >
          <div className="container" style={{ 'transform': 'scale(' + scale + ')'}}>
            <div className="search">
              {this.renderSearch()}
            </div>
            <div className="grid">
              <div className="kanji">
                {this.kanjiblocks.map((block, i) => this.renderKanjiBlock(block, i))}

              </div>
            </div>
            {this.renderInfo()}
            {rightcontent}

          </div>
          {this.renderMinos()}
          <img className="cog" onClick={()=>this.toggleSettings()} src={cog}></img>

          <img className="logo" src={logo}></img>
        </div>
      </div>
    );
  }
}

export class Kanji extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      hover: false,
    }
    this.margin = (this.props.fontsize + 1) * -1;
    this.hover = false;

    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
  }

  mouseEnter(){
    this.setState({hover : true});
  }
  mouseLeave(){
    this.setState({hover : false});
  }

  render(){

    this.classname = "char";
    if(this.props.i <= this.props.progress-1)
      this.classname = this.classname + " checked";
    if(this.props.highlights)
      this.classname = this.classname + " highlighted"

    if(this.state.hover){
      return(
        <div className={this.classname} onClick={()=>this.props.onClick(this.props.i)} onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave} >
          {this.props.kanji}
          <div className={this.classname + " zoom"} style={{ 'marginLeft': this.margin}}>
            {this.props.kanji}
          </div>
        </div>
      );
    }
    else{
      return(
        <div className={this.classname} onClick={()=>this.props.onClick(this.props.i)} onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave} >
          {this.props.kanji}
        </div>
      );
    }
  }


}

export default withRouter(App);
