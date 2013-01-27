//The day layout is easy. There's always 24 hours, and it's just a list.
enyo.kind({
	name: "Day",
	kind: "FittableRows",
	handlers: {
		onNext: "loadNext",
		onPrev: "loadPrev"
	},
	components: [
		{kind: "vi.Inf", name: "inf", fit: true, coreNavi: true, style: "background: white", components: [
			{kind: "DayPage", date: moment().subtract("days", 1)},
			{kind: "DayPage", date: moment()},
			{kind: "DayPage", date: moment().add("days", 1)}
		]}
	],

	//This function is called whenever the page is navigated to using the tab button.
	navigated: function(){
		//Tell the infinite panels kind to go back to where we started:
		this.$.inf.reset([
			{kind: "DayPage", date: moment().subtract("days", 1)},
			{kind: "DayPage", date: moment()},
			{kind: "DayPage", date: moment().add("days", 1)}
		]);
	},
	
	//Load up different days based on where we are in the panels:
	loadNext: function(inSender, inEvent){
		this.$.inf.provideNext({kind: "DayPage", date: moment().add("days", inEvent.current+1)});
	},
	loadPrev: function(inSender, inEvent){
		this.$.inf.providePrev({kind: "DayPage", date: moment().add("days", inEvent.current-1)});
	}
});

//The actual page for one day.
enyo.kind({
	name: "DayPage",
	kind: "FittableRows",
	classes: "day-page",
	published: {
		date: "",
		//TODO: Adjust for smaller screens:
		rowHeight: 56
	},
	components: [
		{classes: "day-page-inner", kind: "FittableRows", fit: true, components: [
			{classes: "day-header", components: [
				{name: "istoday", showing: false, classes: "day-istoday", content: "Today"},
				{name: "title", classes: "day-title", content: ""}
			]},
			{kind: "Scroller", name: "times", classes: "day-scroller", horizontal: "hidden", fit: true, touch: true, thumb: false, components: [
				{style: "height: 20px"},
				{name: "CurrentTime", classes: "day-current-time", showing: false}
				//Dynamically loaded.
				//Note that we don't use a List because that has too much overhead. A simple for loop accomplishes everything we need.
			]}
		]}
	],
	create: function(){
		this.inherited(arguments);
		//If no date is provided, create a new moment:
		if(!this.date){
			this.date = moment();
		}else{
			//Make sure we're using moments:
			this.date = moment(this.date);
		}

		//Check to see if this day is today:
		var today = moment();
		if(today.diff(this.date, "days") === 0){
			this.$.istoday.show();
		}

		//Display the title:
		//TODO: Not sure if we want to display the date number this way.
		//Possibly look into removing the "th", "nd", etc. after numbers.
		this.$.title.setContent(this.date.format("dddd, MMMM Do, YYYY"));

		//Create all of the date rows:
		for(var i = 0; i < 24; i++){
			this.$.times.createComponent({kind: "DayRow", time: i});
		}
	},
	rendered: function(){
		this.inherited(arguments);
		//Set the time bar initially
		if(moment().diff(this.date, "days") === 0){
			this.$.CurrentTime.show();
			this.setTimeBar();
		}else{
			this.$.CurrentTime.hide();
		}
		//Scroll the current time into view:
		//TODO: Only do this if the date is today?
		//TODO: Only do this on create.
		this.scrollToDay();
	},
	setTimeBar: function(){
		var height = moment().hours() * this.getRowHeight();
		height += Math.floor((this.getRowHeight())*((moment().minutes()/60)));
		this.$.CurrentTime.applyStyle("top", height + "px");
		if(this.timer){
			window.clearTimeout(this.timer);
		}
		this.timer = window.setTimeout(enyo.bind(this, "setTimeBar"), 120000);
	},
	destroy: function(){
		window.clearTimeout(this.timer);
		this.inherited(arguments);
	},
	scrollToDay: function(){
		var c = this.$.times.getClientControls();
		var ts = this.$.times;
		ts.scrollToControl(c[moment().hours() + 2], true);
		var st = ts.getScrollTop();
		ts.setScrollTop(st+1);
		if(st !== ts.getScrollTop()){
			ts.setScrollTop(ts.getScrollTop()-15);
		}
	}
});

//The row for the list.
enyo.kind({
	name: "DayRow",
	classes: "day-row",
	published: {
		time: 0
	},
	components: [
		{classes: "day-row-half"},
		{classes: "day-row-label", components: [
			{content: "", name: "time"},
			{content: "", name: "ampm", classes: "day-row-label-ampm"}
		]}
	],
	create: function(){
		this.inherited(arguments);
		var time = this.time % 12;
		if(time === 0){
			time = 12;
		}
		this.$.time.setContent(time);
		this.$.ampm.setContent(this.time >= 12 ? "pm" : "am");
		//TODO: Replace 12 PM with "NOON"?
	}
});

//An event for the day.
//Note that this is only visual right now. We'll probably have to rework this based on the calendar data is actually formatted on webOS.
enyo.kind({
	name: "DayEvent"
});