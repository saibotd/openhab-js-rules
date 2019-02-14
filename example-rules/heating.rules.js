const defaultRules = {
    away: {
        value: 18
    },
    night: {
        value: 18
    },
    day: {
        value: 24,
        start: [
            '30 06 * * 1-4',
            '30 06 * * 5',
            '30 07 * * 6',
            '30 07 * * 0'
        ],
        end: [
            '00 22 * * 1-4',
            '00 23 * * 5',
            '00 23 * * 6',
            '00 22 * * 0'
        ]
    }
}

const defaultState = {
    HeizungKChe_SetpointHeat: { ...defaultRules },
    HeizungBad_SetpointHeat: { ...defaultRules },
    HeizungWohnzimmer_SetpointHeat: { ...defaultRules },
    HeizungFlur_SetpointHeat: { ...defaultRules },
    HeizungBRo_SetpointHeat: { ...defaultRules },
    HeizungMartha_SetpointHeat: {
        ...defaultRules,
        night: { value: 20 },
        day: {
            value: 22,
            start: [
                '30 06 * * *'
            ],
            end: [
                '30 19 * * *'
            ]
        }
    },
    HeizungSchlafzimmer_SetpointHeat: {
        ...defaultRules,
        day: {
            ...defaultRules.day,
            value: 22,
            end: [
                '00 21 * * *'
            ]
        }
    },
}

const PresenceItems = [
    'TobisHandy_Online',
    'ChrissisHandy_Online',
    'Chromecast_Online',
    'PCTobi_Online'
];

const checkOutsideTemperatureInterval = '0 * * * *';

let state;

function save(){
    fs.writeFileSync(
        path.join(__dirname, '_saveState.json'),
        JSON.stringify(
            state,
            (k,v) => (k === 'start' || k === 'end') ? undefined : v,
            2
        )
    );
};

function load(){
    try{
        const file = fs.readFileSync(path.join(__dirname, '_saveState.json'))
        if(file) return JSON.parse(file);
    } catch (e){}
    return {};
}

function calcTemperature(_degrees, increment = 1){
    let degrees = parseFloat(_degrees);
    if(!Item.OutsideTemperature || !Item.OutsideTemperature.state) return degrees;
    const temp = Item.OutsideTemperature.state;
    if(temp <= 5) degrees += increment;
    if(temp <= 0) degrees += increment;
    if(temp >= 10) degrees -= increment;
    if(temp >= 15) degrees -= increment;
    return degrees;
}

function init(){
    state = JSON.parse(JSON.stringify(_.merge(defaultState, load())));
    update();
    log('Inited');
}

function update(){
    const presence = PresenceItems.some((itemName)=>{
        return Item[itemName].state == 'ON'
    });
    for(itemName in Item){
        if(!state[itemName]) continue;
        const _itemState = state[itemName];
        let newState = null;
        if(!presence) newState = 'away';
        else {
            newState = 'night'
            for(stateName in _itemState){
                const _state =  _itemState[stateName];
                if(typeof _state == 'object' && _state.start && _state.end){
                    _state.start.some((_start)=>{
                        return _state.end.some((_end)=>{
                            if(cron.isBetween(_start, _end)){
                                newState = stateName;
                                return true;
                            }
                            return false;
                        });
                    });
                }
            }
        }
        if(newState == 'night'){
            if(itemName == 'HeizungBRo_SetpointHeat' && Item.PCTobi_Online.state == 'ON') newState = 'day'
            if(itemName == 'HeizungWohnzimmer_SetpointHeat' && Item.Chromecast_Online.state == 'ON') newState = 'day'
        }
        if(!_itemState.state || _itemState.state != newState){
            log('Entering new state', itemName, newState);
            _itemState.state = newState;
            if(newState == 'day') Item[itemName].set(calcTemperature(_itemState[newState].value));
            else Item[itemName].set(_itemState[newState].value);
        }
        if(cron.isNow(checkOutsideTemperatureInterval) && _itemState.state == 'day'){
            const _calcTemp = calcTemperature(_itemState[newState].value);
            if(parseFloat(Item[itemName].state) != _calcTemp){
                log('Outside C is', Item.OutsideTemperature.state, 'so', _itemState[newState].value, '->', _calcTemp);
                Item[itemName].set(_calcTemp);
            }
        }
    }
    save();
}

function onEvent({event, item, oldState, newState}){
    if(!item) return;
    if(PresenceItems[item.name]) return update();
    if(!item || !state[item.name]) return;
    const currentItemState = state[item.name].state;
    if(!currentItemState) return;
    if(currentItemState == 'day'){
        log('Manual change', item.name, newState, calcTemperature(newState, -1));
        state[item.name][currentItemState].value = calcTemperature(newState, -1);
    } else if(currentItemState != 'away') {
        log('Manual change', item.name, newState);
        state[item.name][currentItemState].value = parseFloat(newState);
    }
    save();
}

function quit(){
    // Clean up
}

module.exports = {
    init,
    update,
    onEvent,
    quit
}