/*jslint white: false,  sloppy: true */
/*global Mojo, CalendarAlarm, EventUtils: true */
/***************************************************************************
 * When using the following functions, adherence to the schema is assumed.
 * Bad things will happen if you don't give us arrays where we were expecting them.
 ***************************************************************************/
function CalendarAlarm(srcAlarm) {
    var prop;
    var utils = new EventUtils();
    this.action = "display";
    this.alarmTrigger = {
        value: "",
        valueType: "DURATION"
    };
    if (!srcAlarm) {
        return this;
    }
    for (prop in srcAlarm) {
        if (srcAlarm.hasOwnProperty(prop) && utils.alarmProperties[prop]) {
            if (prop == "alarmTrigger") {
                this.alarmTrigger.valueType = srcAlarm.alarmTrigger.valueType;
                this.alarmTrigger.value = srcAlarm.alarmTrigger.value;
                if (srcAlarm.alarmTrigger.related) {
                    this.alarmTrigger.related = srcAlarm.alarmTrigger.related;
                }
            } else {
                this[prop] = srcAlarm[prop];
            }
        }
    }
}
CalendarAlarm.prototype.isEqualTo = function isEqualTo(otherAlarm) {
    var prop;
    if (!otherAlarm) {
        return false;
    }
    var same = false;
    var utils = new EventUtils();
    for (prop in utils.alarmProperties) {
        if (this.hasOwnProperty(prop) || otherAlarm.hasOwnProperty(prop)) {
            //Mojo.Log.info("---:---: Alarm prop %s", prop);
            if (!(prop in otherAlarm && prop in this)) {
                return false;
            }
            if (prop == "alarmTrigger") {
                same = ((this.alarmTrigger.value === otherAlarm.alarmTrigger.value) && (this.alarmTrigger.valueType === otherAlarm.alarmTrigger.valueType));
            } else {
                same = (this[prop] === otherAlarm[prop]);
            }
            if (!same) {
                //Mojo.Log.info("---:---: Alarm prop %s is not the same", prop);
                break;
            }
        }
    }
    return same;
};
/***********************/
function CalendarRRule(srcRRule) {
	var i;
	var j;
	var srcRule;
	this.rules = [];
    var rules = srcRRule.rules,
    rulesLength = rules.length;
    var destValues = [];
    var prop;
    var srcValues;
    var srcValuesLength;
    var srcValue;
    
    if (!srcRRule) {
        return;
    } // A srcRRule is required since there's no such thing as a default rrule.
    var field,
        isNumeric,
        utils = new EventUtils();
    for (prop in srcRRule) {
        if (srcRRule.hasOwnProperty(prop) && utils.rruleProperties[prop]) {
            if (prop != "rules") { // For non-rules fields:
                isNumeric = (prop == "count" || prop == "until") && isNaN(field); //	determine if they require numeric values,
                this[prop] = isNumeric //	if so:
                    ? parseInt(srcRRule[prop], 10) //		convert them to numbers.
                    : srcRRule[prop]; //	otherwise simply copy them.
                continue;
            }
            /* Rules Schema in brief:
             * rules = [rule1, rule2]
             * rule1 = {ruleType, ruleValue}
             * ruleType = "BYDAY"
             * ruleValue = [{ord: 1, day: 2}, {ord:2, day:3}]
             */

            for (i = 0; i < rulesLength; i++) {
                srcRule = rules[i];
               
                    srcValues = srcRule.ruleValue;
                    srcValuesLength = srcValues.length;
                for (j = 0; j < srcValuesLength; j++) {
                    srcValue = srcValues[j];
                    destValues.push({
                        ord: srcValue.ord,
                        day: srcValue.day
                    });
                }
                this.rules.push({
                    ruleType: srcRule.ruleType,
                    ruleValue: destValues
                });
            }
        }
    }
}
CalendarRRule.prototype.isEqualTo = function isEqualTo(otherRRule) {
    if (!otherRRule) {
        return false;
    }

    function compareRuleValues(value1, value2) {
    	var i; 
        var val1;
        var value1Length = value1.length;
        var value2Length = value2.length;
        var sameValue;
        var val2;

        if (value1Length !== value2Length) {
            return false;
        }
        for (i = 0; i < value1Length; i++) {
            val1 = value1[i];
            val2 = value2[i];
                sameValue = (val1.ord === val2.ord && val1.day === val2.day);
            if (!sameValue) {
                return false;
            }
        }
        return true;
    }

    function compareRules(rules1, rules2) {
    	var rules1Item;
        var rules1Length = rules1.length;
        var rules2Length = rules2.length;

        if (rules1Length !== rules2Length) {
            return false;
        }
        for (var i = 0; i < rules1Length; i++) {
            rules1Item = rules1[i];
            rules2Item = rules2[i];
            if (rules1Item.ruleType !== rules2Item.ruleType) {
                return false;
            }
            var sameRuleValue = compareRuleValues(rules1Item.ruleValue, rules2Item.ruleValue);
            if (!sameRuleValue) {
                return false;
            }
        }
        return true;
    }
    var same = false;
    var utils = new EventUtils();
    for (var prop in utils.rruleProperties) {
        if (this.hasOwnProperty(prop) || otherRRule.hasOwnProperty(prop)) {
            //Mojo.Log.info("---:---: RRULE prop %s", prop);
            if (!(prop in otherRRule && prop in this)) {
                return false;
            }
            if (prop != "rules") {
                same = (this[prop] === otherRRule[prop]);
            } else {
                same = compareRules(this.rules, otherRRule.rules);
            }
            if (!same) {
                //Mojo.Log.info("---:---: RRule prop %s is not the same", prop);
                break;
            }
        }
    }
    return same;
};

/*********************************************************************************************************/
function CalendarEvent(srcEvent, params) {
    var prop;
    var i;
    this.dtstart = undefined;
    this.dtend = undefined;
    this.allDay = false;
    this.subject = ""; // NOTE: Do not default this to anything but null or an empty string
    this.location = "";
    this.note = "";
    this.tzId = "";
    this.rrule = null; // NOTE: Set to null or don't define so rrule != null query will work.
    this.alarm = [new CalendarAlarm()];
    if (!srcEvent) {
        return this;
    }
    var utils = new EventUtils();
    for (prop in srcEvent) {
        if (srcEvent.hasOwnProperty(prop) && utils.eventProperties[prop]) {
            switch (prop) {
            case "alarm":
                this.alarm = utils.copyCleanAlarms(srcEvent.alarm);
                break;
                /*case "attendees"    :
                    this.attendees = utils.copyCleanAttendees(srcEvent.attendees);
                    break;*/
            case "created":
            case "dtend":
            case "dtstart":
            case "lastModified":
            case "parentDtstart":
            case "priority":
            case "sequence":
                this[prop] = parseInt(srcEvent[prop], 10); // Ensure numeric values per webOS CalendarEvent Spec.
                break;
            case "exdates":
                this.exdates = utils.copyCleanExdates(srcEvent.exdates);
                break;
                /*case "rrule"        :
                    this.rrule = srcEvent.rrule ? new CalendarRRule(srcEvent.rrule) : null;
                    break;*/
            default:
                this[prop] = srcEvent[prop];
                break;
            }
        }
    }
    if (params && params.exclude && params.exclude.length) {
        var excludeList = params && params.exclude;
        var excludeListLength = (excludeList && excludeList.length) || 0;
        for (i = 0; i < excludeListLength; i++) {
            delete this[excludeList[i]];
        }
    }
}
CalendarEvent.prototype.isEqualTo = function isEqualTo(otherEvent) {
    var same = true;
    var i;
    var prop;
    var utils = new EventUtils();
    var thisAlarmLength;
    var otherAlarmLength;
    var otherAlarmItem;
    var thisExdatesLength;
    var otherExdatesLength;
    var thisAttendeesLength;
    var otherAttendeeItem;
    var thisAlarmItem;
    var thisAttendeeItem;
    var otherAttendeesLength;
     

    for (prop in utils.eventProperties) {
        if (this.hasOwnProperty(prop) || otherEvent.hasOwnProperty(prop)) {
            //Mojo.Log.info("---:---: Event prop %s", prop);
            if (!(prop in otherEvent && prop in this)) {
                console.log("---:---: CalendarEvent.isEqualTo: The [" + prop + "] field only exists in one of these two events.");
                return false;
            }
            switch (prop) {
            case "alarm":
                thisAlarmLength = (this.alarm && this.alarm.length) || 0;
                otherAlarmLength = (otherEvent.alarm && otherEvent.alarm.length) || 0;
                same = (thisAlarmLength === otherAlarmLength);
                if (same && thisAlarmLength) {
                    for (i = 0; i < thisAlarmLength; i++) {
                        thisAlarmItem = this.alarm[i];
                        otherAlarmItem = otherEvent.alarm[i];
                        same = thisAlarmItem.isEqualTo(otherAlarmItem);
                        if (!same) {
                            break;
                        }
                    }
                }
                break;
            case "attendees":
                thisAttendeesLength = (this.attendees && this.attendees.length) || 0;
                otherAttendeesLength = (otherEvent.attendees && otherEvent.attendees.length) || 0;
                same = (thisAttendeesLength === otherAttendeesLength);
                if (same && thisAttendeesLength) {
                    for (i = 0; i < thisAttendeesLength; i++) {
                        thisAttendeeItem = this.attendees[i];
                        otherAttendeeItem = otherEvent.attendees[i];
                        same = thisAttendeeItem.isEqualTo(otherAttendeeItem);
                        if (!same) {
                            break;
                        }
                    }
                }
                break;
            case "rrule":
                same = (this.rrule && otherEvent.rrule) || (!this.rrule && !otherEvent.rrule);
                if (same && this.rrule) {
                    same = this.rrule.isEqualTo(otherEvent.rrule);
                }
                break;
            case "exdates":
                thisExdatesLength = (this.exdates && this.exdates.length) || 0;
                otherExdatesLength = (otherEvent.exdates && otherEvent.exdates.length) || 0;
                same = (thisExdatesLength === otherExdatesLength);
                if (same && thisExdatesLength) {
                    for (i = 0; i < thisExdatesLength; i++) {
                        same = (this.exdates[i] == otherEvent.exdates[i]);
                        if (!same) {
                            break;
                        }
                    }
                }
                break;
            default:
                same = (this[prop] === otherEvent[prop]);
                break;
            }
            if (!same) {
                console.log("---:---: CalendarEvent.isEqualTo: The [ " + prop + " ] property is different between these events.");
                return false;
            }
        }
    }
    return true;
};


/*********************************************************************************************************/
function EventUtils() {}
EventUtils.prototype.copyCleanAlarms = function copyCleanAlarms(srcAlarmList) {
    var numAlarms = (srcAlarmList && srcAlarmList.length) || 0;
    var destAlarmList = [];
    var destAlarm;
    var i;
    for (i = 0; i < numAlarms; i++) {
        destAlarm = new CalendarAlarm(srcAlarmList[i]);
        destAlarmList.push(destAlarm);
    }
    return destAlarmList;
};
/*
EventUtils.prototype.copyCleanAttendees = function copyCleanAttendees(srcAttendeeList) {
    var numAttendees = (srcAttendeeList && srcAttendeeList.length) || 0;
    var destAttendeeList = [];
    for (var i = 0; i < numAttendees; i++) {
        var destAttendee = new CalendarAttendee(srcAttendeeList[i]);
        destAttendeeList.push(destAttendee);
    }
    return destAttendeeList;
};
*/
EventUtils.prototype.copyCleanExdates = function copyCleanExdates(srcExdatesList) {
    if (srcExdatesList && srcExdatesList.concat) {
        return srcExdatesList.concat([]);
    }
};
EventUtils.prototype.eventProperties = {
    "_id": 1,
    "_kind": 1,
    "tzId": 1,
    "dtstart": 1,
    "dtend": 1,
    "rrule": 1,
    "subject": 1,
    "location": 1,
    "note": 1,
    "alarm": 1,
    "sequence": 1,
    "transp": 1,
    "rdates": 1,
    "exdates": 1,
    "attendees": 1,
    "classification": 1,
    "dtstamp": 1,
    "parentDtstart": 1,
    "allDay": 1,
    "calendarId": 1,
    "accountId": 1,
    "parentId": 1,
    "created": 1,
    "geo": 1,
    "priority": 1,
    "recurrenceId": 1,
    "url": 1,
    "categories": 1,
    "comment": 1,
    "contact": 1,
    "resources": 1,
    "attach": 1,
    "notify": 1,
    "status": 1,
    "whenDesc": 1
};
EventUtils.prototype.alarmProperties = {
    "alarmTrigger": 1,
    "action": 1,
    "trigger": 1,
    "repeat": 1,
    "duration": 1,
    "attach": 1,
    "description": 1,
    "summary": 1,
    "attendee": 1
};
EventUtils.prototype.alarmTriggerProperties = {
    "valueType": 1,
    "value": 1,
    "related": 1
};
EventUtils.prototype.attendeeProperties = {
    "organizer": 1,
    "email": 1,
    "commonName": 1,
    "calendarUserType": 1,
    "member": 1,
    "role": 1,
    "participationStatus": 1,
    "rsvp": 1,
    "delegatedTo": 1,
    "delegatedFrom": 1,
    "sentBy": 1,
    "dir": 1,
    "language": 1,
    "notifyState": 1
};
EventUtils.prototype.rruleProperties = {
    "freq": 1,
    "wkst": 1,
    "until": 1,
    "count": 1,
    "interval": 1,
    "rules": 1
};
EventUtils.prototype.rruleRuleProperties = {
    "ruleType": 1,
    "ruleValue": 1
};
EventUtils.prototype.ordDayProperties = {
    "ord": 1,
    "day": 1
};
(function () {
    /** Closure to hold private singular EventUtils instance. */
    // Create the singular private EventUtils instance:
    var singleton = new EventUtils();
    // Override the EventUtils constructor to always returns its singular instance:
    EventUtils = function EventUtils() {
        return singleton;
    };
})();
