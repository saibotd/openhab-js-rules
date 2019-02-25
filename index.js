process.chdir(__dirname);
require('dotenv').config()
const EventSource = require('eventsource');
const axios = require('axios');
const moment = require('moment-timezone');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const reload = require('require-reload')(require);
const log = require('./src/log');
const cron = require('./src/cron');

const url = process.env.OPENHAB_URL + '/rest';

var rules = [];
const Item = {};
const globalModules = {axios, _, moment, fs, path, log, cron, Item};
_.forEach(globalModules, (m,k)=>{ global[k] = m });

const es = new EventSource(url.concat('/events'));

async function loadRules(rulesDir = './rules'){
    const files = fs.readdirSync(rulesDir).map((f)=>{
        const file = path.join(__dirname, rulesDir, f);
        if(f.endsWith('.rules.js')) return file;
        return null;
    });
    const _rules = [];
    files.forEach((ruleScript)=>{
        if(!ruleScript) return;
        const fileStat = fs.lstatSync(ruleScript);
        let rule;
        rules.some((_rule)=>{
            if(_rule.id == ruleScript && _rule.mtime == fileStat.mtimeMs){
                rule = _rule;
                return true;
            }
            return false;
        });
        if(!rule){
            log('(re)loading rules', ruleScript);
            rules.some((_rule)=>{
                if(_rule.id == ruleScript && _rule.quit){
                    _rule.quit();
                    return true;
                }
                return false;
            });
            rule = reload(ruleScript);
            rule.id = ruleScript;
            rule.mtime = fileStat.mtimeMs;
            if(rule.init){
                try{
                    rule.init();
                } catch (e){
                    console.error('Rule function failed!', 'init', e);
                }
            }
        }
        _rules.push(rule);
    });
    rules = _rules;
}

const onEvent = (e) => {
    var event;
    try{
        event = JSON.parse(e.data);
        if(event.payload) event.payload = JSON.parse(event.payload);
    } catch (e){
        return console.error(e)
    }
    let item, newState, oldState;
    if(event.type == 'ItemStateEvent' && event.payload){
        for(const name in Item){
            if(event.topic.indexOf(`/items/${name}/`) >= 0){
                item = Item[name];
                oldState = item.state;
                newState = event.payload.value;
                item.state = event.payload.value;
                if(oldState != newState) log('Received update', name, `${oldState} -> ${newState}`);
            }
        }
    }
    rules.forEach((rule)=>{
        if(rule.onEvent){
            try{
                rule.onEvent({
                    event,
                    item,
                    newState,
                    oldState
                });
            } catch (e){
                console.error('Rule function failed!', 'onEvent', e);
            }
        }
    });
}

async function update(){
    await loadRules();
    rules.forEach((rule)=>{
        if(rule.update){
            try{
                rule.update();
            } catch (e){
                console.error('Rule function failed!', 'update', e);
            }
        }
    });
}

function setupRules(){
    es.addEventListener('message', onEvent);
    setInterval(update, 1000 * 60);
    update();
}

async function init(){
    const {data} = await axios.get(url.concat('/items'));
    data.forEach((item)=>{
        if(!item.stateDescription || item.stateDescription.readOnly){
            item.set = (state) => {
                console.error('Item is read only!', item, state);
            }
        } else {
            item.set = (state)=>{
                if(state == item.state) return;
                log('Posting new state', item.name, state);
                axios.post(item.link, `${state}`, {'headers': {'content-type': 'text/plain'}})
                .catch((e)=>log(e))
            }
        }
        Item[item.name] = item;
        log('Added Item', item.name, '->', item.state);
    });
    setupRules();
}

function connect(){
    log('Connecting', url);
    axios.get(url)
    .then(()=> init())
    .catch(e => {
        console.error('Could not connect to openHAB', e.message);
        setTimeout(connect, 10000);
    })
}

connect();