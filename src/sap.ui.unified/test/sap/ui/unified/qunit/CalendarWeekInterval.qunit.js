/*global QUnit, window */
/*eslint no-undef:1, no-unused-vars:1, strict: 1, no-console: 1*/
sap.ui.define([
	"sap/ui/qunit/QUnitUtils",
	"sap/ui/unified/CalendarWeekInterval",
	"sap/ui/unified/calendar/CalendarDate"
], function(qutils, CalendarWeekInterval, CalendarDate) {
	"use strict";

	// set language to en-US, since we have specific language strings tested
	sap.ui.getCore().getConfiguration().setLanguage("en_US");

	QUnit.module("Events", {
		beforeEach: function () {
			this.oPC = new sap.m.PlanningCalendar('pc1', {
				startDate: new Date(2015, 0, 1, 8, 0, 0),
				viewKey: "Week",
				rows: [
					new sap.m.PlanningCalendarRow("pc1-Row1", {
						icon: "sap-icon://employee",
						title: "Max Mustermann",
						text: "Musterteam",
						tooltip: "Header tooltip",
						intervalHeaders: [
							new sap.ui.unified.CalendarAppointment("pc1-row1-R1H1",{
								startDate: new Date(2015, 0, 1, 9, 0),
								endDate: new Date(2015, 0, 1, 11, 0),
								type: sap.ui.unified.CalendarDayType.Type02,
								title: "SAPUI5",
								tooltip: "Test",
								icon: "sap-icon://sap-ui5"
							})
						],
						appointments: [
							new sap.ui.unified.CalendarAppointment("pc1-row1-R1A1", {
								startDate: new Date(2015, 0, 1, 8, 0),
								endDate: new Date(2015, 0, 1, 9, 0),
								type: sap.ui.unified.CalendarDayType.Type01,
								title: "App 1",
								icon: "../../ui/unified/images/m_01.png",
								tooltip: "Tooltip",
								text: "Text"
							}),
							new sap.ui.unified.CalendarAppointment("pc1-row1-R1A2", {
								startDate: new Date(2015, 0, 1, 7, 0),
								endDate: new Date(2015, 0, 1, 11, 0),
								type: sap.ui.unified.CalendarDayType.Type02,
								title: "App 2",
								icon: "sap-icon://home",
								tooltip: "Tooltip",
								text: "Text",
								tentative: true
							}),
							new sap.ui.unified.CalendarAppointment("pc1-row1-R1A3", {
								startDate: new Date(2015, 0, 2, 8, 30),
								endDate: new Date(2015, 0, 2, 9, 30),
								type: sap.ui.unified.CalendarDayType.Type03,
								title: "App3",
								icon: "sap-icon://home",
								tooltip: "Tooltip"
							}),
							new sap.ui.unified.CalendarAppointment("pc1-row1-R1A4", {
								startDate: new Date(2014, 6, 1),
								endDate: new Date(2014, 6, 2),
								type: sap.ui.unified.CalendarDayType.Type04,
								title: "Meeting 4",
								tooltip: "Tooltip 4",
								selected: true
							})
						]
					}),
					new sap.m.PlanningCalendarRow("pc1-Row2", {
						icon: "../../ui/unified/images/m_01.png",
						title: "Edward",
						text: "the great",
						tooltip: "Header tooltip",
						nonWorkingDays: [2,3],
						nonWorkingHours: [11, 12],
						intervalHeaders: [
							new sap.ui.unified.CalendarAppointment("pc1-row2-R2H1",{
								startDate: new Date(2015, 0, 2),
								endDate: new Date(2015, 0, 2, 23, 59),
								type: sap.ui.unified.CalendarDayType.Type01,
								title: "SAPUI5",
								tooltip: "Test",
								icon: "sap-icon://sap-ui5"
							})
						],
						appointments: [
							new sap.ui.unified.CalendarAppointment("pc1-row2-R2A1", {
								startDate: new Date(2015, 0, 1),
								endDate: new Date(2015, 0, 2, 23, 59),
								type: sap.ui.unified.CalendarDayType.Type01,
								title: "App 1",
								tooltip: "Tooltip",
								text: "Text"
							})
						]
					})
				],
				specialDates: [
					new sap.ui.unified.DateTypeRange("pc1-SD1", {
						startDate: new Date(2015, 0, 6),
						type: sap.ui.unified.CalendarDayType.Type01,
						tooltip: "Heilige 3 Könige"
					}),
					new sap.ui.unified.DateTypeRange("pc1-SD2", {
						startDate: new Date(2015, 0, 1, 12, 0),
						endDate: new Date(2015, 0, 1, 14, 0),
						type: sap.ui.unified.CalendarDayType.Type02,
						tooltip: "Lunch"
					})
				],
				toolbarContent: [new sap.m.SearchField(), new sap.m.Button()],
				appointmentSelect: function(oEvent){
					console.log("Appointment select event fired");
				},
				startDateChange: function(oEvent){
					console.log("Start date change event fired");
				},
				rowSelectionChange:  function(oEvent){
					console.log("Row selection change event fired");
				},
				viewChange: function(oEvent){
					console.log("ViewChange event fired");
				},
				intervalSelect: function (oEvent) {
					console.log("IntervalSelect event fired");
				}
			});
			this.oPC.placeAt("content");
			sap.ui.getCore().applyChanges();
			this.sut = this.oPC.getAggregation("table").getAggregation("infoToolbar").getContent()[1];
			this.sutMonth = this.sut.getAggregation("month")[0];
		},
		afterEach: function () {
			this.oPC.destroy();
			this.oPC = undefined;
		}
	});

	QUnit.test("'_handleFocus()' has correct output when datesRow is is focused in visible area", function (assert) {
		//prepare
		var _handleFocusCalendarDateSpy = this.spy(sap.ui.unified.CalendarDateInterval.prototype, "_handleFocus"),
			_focusDateExtendCalendarDateSpy = this.spy(sap.ui.unified.CalendarDateInterval.prototype, "_focusDateExtend"),
			_focusDateExtendWeekDateSpy = this.spy(this.sut, "_focusDateExtend"),
			oDate = new Date(2015, 0, 2, 19, 15, 0);
		//act
		this.sutMonth.fireFocus({
			date : oDate,
			otherMonth : false,
			restoreOldDate : false
		});
		//assert
		assert.strictEqual(_handleFocusCalendarDateSpy.callCount, 1, "CalendarDateInterval '_handleFocus()' was called for first time");
		assert.strictEqual(_focusDateExtendCalendarDateSpy.callCount, 1, "CalendarDateInterval '_focusDateExtend()' was called for first time");
		assert.strictEqual(_focusDateExtendWeekDateSpy.callCount, 1, "CalendarWeekInterval '_focusDateExtend()' was called for first time");
	});

	QUnit.test("'_handleFocus()' has correct output when datesRow is is focused outside visible area (border reached)", function (assert) {
		//prepare
		var _handleFocusCalendarDateSpy = this.spy(sap.ui.unified.CalendarDateInterval.prototype, "_handleFocus"),
				_focusDateExtendCalendarDateSpy = this.spy(sap.ui.unified.CalendarDateInterval.prototype, "_focusDateExtend"),
				_focusDateExtendWeekDateSpy = this.spy(this.sut, "_focusDateExtend"),
				oDate = new Date(2015, 0, 2, 19, 15, 0);
		//act
		this.sutMonth.fireFocus({
			date : oDate,
			otherMonth : false,
			restoreOldDate : false,
			_outsideBorder: true
		});
		//assert
		assert.strictEqual(_handleFocusCalendarDateSpy.callCount, 1, "CalendarDateInterval '_handleFocus()' was called");
		assert.strictEqual(_focusDateExtendCalendarDateSpy.callCount, 0, "CalendarDateInterval '_focusDateExtend()' should not be called");
		assert.strictEqual(_focusDateExtendWeekDateSpy.callCount, 1, "CalendarWeekInterval '_focusDateExtend()' was called");
	});

	QUnit.test("'_focusDateExtend()' has correct output", function (assert) {
		//prepare
		var _focusDateExtendSpy = this.spy(this.sut, "_focusDateExtend"),
			oExpectedDate = CalendarDate.fromLocalJSDate(new Date(2015, 0, 3, 12, 0, 0));

		//act
		this.sut._focusDate(oExpectedDate, false, true);
		//assert
		assert.strictEqual(_focusDateExtendSpy.callCount, 1, "'_focusDateExtend()' was called once");
		assert.ok(_focusDateExtendSpy.calledWith(oExpectedDate, false, true), "'_focusDateExtend()' was called with the correct parameters");
		//act
		this.sut._focusDate(oExpectedDate, true, false);
		//assert
		assert.strictEqual(_focusDateExtendSpy.callCount, 2, "'_focusDateExtend()' was called twice");
		assert.ok(_focusDateExtendSpy.calledWith(oExpectedDate, true, false), "'_focusDateExtend()' was called with the correct parameters");
	});

	QUnit.module("Calendar Picker");
	QUnit.test("If choosed date from the Calendar picker is in the 'selected' week the startDate should stay the same", function(assert) {
		// arrange
		var $Date,
			oCalP = new CalendarWeekInterval("CalP",{
						startDate: new Date("2015", "7", "9"),
						pickerPopup: true
					}).placeAt("qunit-fixture");

		sap.ui.getCore().applyChanges();

		assert.ok(!jQuery("#CalP--Cal").get(0), "Calendar3: Calendar picker not initial rendered");
		qutils.triggerEvent("click", "CalP--Head-B1");
		assert.ok(jQuery("#CalP--Cal").get(0), "Calendar picker rendered");
		assert.equal(jQuery("#CalP--Cal").parent().attr("id"), "sap-ui-static", "Calendar picker rendered in static area");
		assert.ok(jQuery(jQuery("#CalP--Cal").get(0)).is(":visible"), "Calendar picker visible");

		// select 14.08.2015
		$Date = jQuery("#CalP--Cal--Month0-20150814");
		$Date.focus();
		qutils.triggerKeyboardEvent($Date[0], jQuery.sap.KeyCodes.ENTER, false, false, false);

		assert.equal(sap.ui.getCore().byId("CalP").getStartDate().getDate(), 9, "start date is set correctly");

		assert.ok(jQuery("#CalP--Cal").get(0), "Calendar picker still rendered after closing");
		assert.ok(!jQuery(jQuery("#CalP--Cal").get(0)).is(":visible"), "Calendar picker not visible after closing");

		// clean
		oCalP.destroy();
	});

	QUnit.test("If choosed date from the Calendar picker is NOT in the 'selected' week the startDate should be changed to the start date of the week in which is the selected date", function(assert) {
		// arrange
		var $Date,
			oCalP = new CalendarWeekInterval("CalP",{
						startDate: new Date("2015", "7", "9"),
						pickerPopup: true
					}).placeAt("qunit-fixture");

		sap.ui.getCore().applyChanges();

		assert.ok(!jQuery("#CalP--Cal").get(0), "Calendar3: Calendar picker not initial rendered");
		qutils.triggerEvent("click", "CalP--Head-B1");
		assert.ok(jQuery("#CalP--Cal").get(0), "Calendar picker rendered");
		assert.equal(jQuery("#CalP--Cal").parent().attr("id"), "sap-ui-static", "Calendar picker rendered in static area");
		assert.ok(jQuery(jQuery("#CalP--Cal").get(0)).is(":visible"), "Calendar picker visible");

		// select 14.08.2015
		$Date = jQuery("#CalP--Cal--Month0-20150805");
		$Date.focus();
		qutils.triggerKeyboardEvent($Date[0], jQuery.sap.KeyCodes.ENTER, false, false, false);

		assert.equal(sap.ui.getCore().byId("CalP").getStartDate().getDate(), 2, "start date is set correctly");

		assert.ok(jQuery("#CalP--Cal").get(0), "Calendar picker still rendered after closing");
		assert.ok(!jQuery(jQuery("#CalP--Cal").get(0)).is(":visible"), "Calendar picker not visible after closing");

		// clean
		oCalP.destroy();
	});

	QUnit.test("fireStartDateChange", function(assert) {
		// arrange
		var $Date, oCalStartDate,
			oSpyFireDateChange = this.spy(sap.ui.unified.CalendarWeekInterval.prototype, "fireStartDateChange"),
			oCalP = new CalendarWeekInterval("CalP",{
						startDate: new Date("2015", "7", "9"),
						pickerPopup: true
					}).placeAt("qunit-fixture");

		sap.ui.getCore().applyChanges();

		assert.ok(!jQuery("#CalP--Cal").get(0), "Calendar picker not initial rendered");
		qutils.triggerEvent("click", "CalP--Head-B1");

		// click on Month button inside calendar picker
		qutils.triggerEvent("click", "CalP--Cal--Head-B1");
		// click on September
		$Date = jQuery("#CalP--Cal--MP-m8");
		$Date.focus();
		qutils.triggerKeyboardEvent($Date[0], jQuery.sap.KeyCodes.ENTER, false, false, false);

		// click on Year button inside calendar picker
		qutils.triggerEvent("click", "CalP--Cal--Head-B2");
		// click on 2016
		$Date = jQuery("#CalP--Cal--YP-y20160101");
		$Date.focus();
		qutils.triggerKeyboardEvent($Date[0], jQuery.sap.KeyCodes.ENTER, false, false, false);

		// click on 17 of September 2016
		$Date = jQuery("#CalP--Cal--Month0-20160917");
		$Date.focus();
		qutils.triggerKeyboardEvent($Date[0], jQuery.sap.KeyCodes.ENTER, false, false, false);

		oCalStartDate = sap.ui.getCore().byId("CalP").getStartDate();

		assert.equal(oCalStartDate.getDate(), 11, "start date, date is set correctly");
		assert.equal(oCalStartDate.getMonth(), 8, "start date, month is set correctly");
		assert.equal(oCalStartDate.getFullYear(), 2016, "start date, year is set correctly");
		assert.strictEqual(oSpyFireDateChange.callCount, 1, "CalendarWeekInterval 'fireStartDateChange' was called once after selecting month, year and date");

		// clean
		oCalP.destroy();
	});

	QUnit.test("User opens the picker but escapes it - click outside for desktop or click cancel button", function(assert) {
		// arrange
		var oSpyCancel = this.spy(sap.ui.unified.CalendarWeekInterval.prototype, "fireCancel");
		var oCalP = new CalendarWeekInterval("CalP",{
			pickerPopup: true
			}).placeAt("qunit-fixture");

		sap.ui.getCore().applyChanges();

		qutils.triggerEvent("click", "CalP--Head-B1");
		assert.ok(jQuery(jQuery("#CalP--Cal").get(0)).is(":visible"), "Calendar picker visible");

		sap.ui.test.qunit.triggerKeydown(sap.ui.getCore().byId("CalP").getFocusDomRef(), jQuery.sap.KeyCodes.ESCAPE);
		assert.ok(!jQuery(jQuery("#CalP--Cal").get(0)).is(":visible"), "Calendar picker not visible after closing");
		assert.strictEqual(oSpyCancel.callCount, 1, "CalendarWeekInterval 'fireCancel' was called once");

		// clean
		oCalP.destroy();
	});

	QUnit.test("User opens date picker from the button and sees a predefined range of days marked in the date picker.", function(assert) {
		// arrange
		var oCalPicker,
			$Date,
			oCalP = new CalendarWeekInterval("CalP",{
						startDate: new Date("2017", "7", "6"),
						pickerPopup: true
					}).placeAt("qunit-fixture");

		sap.ui.getCore().applyChanges();

		qutils.triggerEvent("click", "CalP--Head-B1");
		assert.ok(jQuery(jQuery("#CalP--Cal").get(0)).is(":visible"), "Calendar picker visible");

		oCalPicker = oCalP.getAggregation("calendarPicker");

		// check for selected date range
		assert.strictEqual(oCalPicker.getSelectedDates()[0].getStartDate().getDate(), 6, "start date is 6");
		assert.strictEqual(oCalPicker.getSelectedDates()[0].getEndDate().getDate(), 12, "end date is 12");

		// click on 17 of August 2017
		$Date = jQuery("#CalP--Cal--Month0-20170817");
		$Date.focus();
		qutils.triggerKeyboardEvent($Date[0], jQuery.sap.KeyCodes.ENTER, false, false, false);

		// open again the CalendarPicker
		qutils.triggerEvent("click", "CalP--Head-B1");

		// check for the selected date range
		assert.strictEqual(oCalPicker.getSelectedDates()[0].getStartDate().getDate(), 13, "start date is 13");
		assert.strictEqual(oCalPicker.getSelectedDates()[0].getEndDate().getDate(), 19, "end date is 19");

		sap.ui.test.qunit.triggerKeydown(sap.ui.getCore().byId("CalP").getFocusDomRef(), jQuery.sap.KeyCodes.ESCAPE);

		// clean
		oCalP.destroy();
	});

	QUnit.test("Text of the direct navigation button is correct", function(assert) {
		// arrange
		var $Date,
			oCalP = new CalendarWeekInterval("CalP",{
						startDate: new Date("2017", "4", "11"),
						pickerPopup: true
					}).placeAt("qunit-fixture");

		sap.ui.getCore().applyChanges();

		qutils.triggerEvent("click", "CalP--Head-B1");

		// click on Month button inside calendar picker
		qutils.triggerEvent("click", "CalP--Cal--Head-B1");
		// click on December
		$Date = jQuery("#CalP--Cal--MP-m11");
		$Date.focus();
		qutils.triggerKeyboardEvent($Date[0], jQuery.sap.KeyCodes.ENTER, false, false, false);

		// click on 11 of December
		$Date = jQuery("#CalP--Cal--Month0-20171211");
		$Date.focus();
		qutils.triggerKeyboardEvent($Date[0], jQuery.sap.KeyCodes.ENTER, false, false, false);

		assert.strictEqual(jQuery("#CalP--Head-B1").text(), "December 2017", "button text is correct");

		// clean
		oCalP.destroy();
	});

	QUnit.test("Changing of the pickerPopup mode doesn't break min and max date inside yearPicker aggregation", function(assert) {
		// arrange
		var oCalP = new CalendarWeekInterval("CalP",{
			pickerPopup: false
			}),
			oYearPicker = oCalP.getAggregation("yearPicker");

		// initialy the yearPicker has default values for min and max year
		assert.strictEqual(oYearPicker._oMinDate.getYear(), 1, "min year is set to 1");
		assert.strictEqual(oYearPicker._oMaxDate.getYear(), 9999, "max year is set to 9999");

		// change the pickerPopup to true, this will destroy the yearPicker aggregation
		oCalP.setPickerPopup(true);
		// set new min and max dates
		oCalP.setMinDate(new Date("2015", "7", "13", "8", "0", "0"));
		oCalP.setMaxDate(new Date("2017", "7", "13", "8", "0", "0"));

		// return pickrPopup property to true, this will create the yearPicker aggregation
		oCalP.setPickerPopup(false);
		oYearPicker = oCalP.getAggregation("yearPicker");

		// check if the yearPicker has the newly setted min and max date of the Interval control
		assert.strictEqual(oYearPicker._oMinDate.getYear(), 2015, "min year is set to 2015");
		assert.strictEqual(oYearPicker._oMaxDate.getYear(), 2017, "max year is set to 2017");

		// clean
		oCalP.destroy();
	});

	QUnit.test("Changing of the pickerPopup mode doesn't break min and max date inside calendarPicker aggregation", function(assert) {
		// arrange
		var oCalPicker,
			oCalP = new CalendarWeekInterval("CalP",{
				pickerPopup: true
			}).placeAt("qunit-fixture");

		sap.ui.getCore().applyChanges();

		// open calendarPicker
		qutils.triggerEvent("click", "CalP--Head-B1");

		oCalPicker = oCalP.getAggregation("calendarPicker");

		// initialy the yearPicker has default values for min and max year
		assert.strictEqual(oCalPicker._oMinDate.getYear(), 1, "min year is set to 1");
		assert.strictEqual(oCalPicker._oMaxDate.getYear(), 9999, "max year is set to 9999");

		// close calendarPicker
		sap.ui.test.qunit.triggerKeydown(sap.ui.getCore().byId("CalP").getFocusDomRef(), jQuery.sap.KeyCodes.ESCAPE);
		sap.ui.getCore().applyChanges();

		// change the pickerPopup to false
		oCalP.setPickerPopup(false);
		// set new min and max dates
		oCalP.setMinDate(new Date("2015", "7", "13", "8", "0", "0"));
		oCalP.setMaxDate(new Date("2017", "7", "13", "8", "0", "0"));

		// return pickerPopup property to true, this will create the calendarPicker aggregation
		oCalP.setPickerPopup(true);

		// open calendarPicker
		qutils.triggerEvent("click", "CalP--Head-B1");

		oCalPicker = oCalP.getAggregation("calendarPicker");

		// check if the yearPicker has the newly setted min and max date of the Interval control
		assert.strictEqual(oCalPicker._oMinDate.getYear(), 2015, "min year is set to 2015");
		assert.strictEqual(oCalPicker._oMaxDate.getYear(), 2017, "max year is set to 2017");

		sap.ui.test.qunit.triggerKeydown(sap.ui.getCore().byId("CalP").getFocusDomRef(), jQuery.sap.KeyCodes.ESCAPE);
		// clean
		oCalP.destroy();
	});

	QUnit.module("Private API");

	QUnit.test("_calculateStartDate should call _getMaxDateAlignedToMinDate and _getStartDateAlignedToMinAndMaxDate with correct params", function (assert) {
		// Arrange
		var iDays = 6,
				oExpectedCalculatedMaxDate = new CalendarDate(2018, 11, 20),
				oStartDate = new CalendarDate(2018, 10, 20),
				oCalendarWeekInterval = new CalendarWeekInterval({ maxDate: new Date(2018, 11, 20) }),
				ogetMaxDateAlignedToMinDateSpy = this.spy(oCalendarWeekInterval, "_getMaxDateAlignedToMinDate"),
				oAlignStartDateToMinAndMaxSpy = this.spy(oCalendarWeekInterval, "_getStartDateAlignedToMinAndMaxDate"),
				oGetDaysStub = this.stub(oCalendarWeekInterval, "_getDays", function () { return iDays; });

		// Act
		oCalendarWeekInterval._calculateStartDate(oCalendarWeekInterval._oMaxDate, oCalendarWeekInterval._oMinDate, oStartDate);

		// Assert
		assert.equal(ogetMaxDateAlignedToMinDateSpy.getCall(0).args[0].toString(), oExpectedCalculatedMaxDate.toString(), "_getMaxDateAlignedToMinDate is called with right maxDate");
		assert.equal(oAlignStartDateToMinAndMaxSpy.getCall(0).args[0].toString(), oExpectedCalculatedMaxDate.toString(), "_getStartDateAlignedToMinAndMaxDate is called with right maxDate");

		// Cleanup
		ogetMaxDateAlignedToMinDateSpy.restore();
		oAlignStartDateToMinAndMaxSpy.restore();
		oGetDaysStub.restore();
		oCalendarWeekInterval.destroy();
	});
});