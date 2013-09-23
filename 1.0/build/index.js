/*
combined files : 

gallery/kschedule/1.0/scheduleform
gallery/kschedule/1.0/index

*/
KISSY.add('gallery/kschedule/1.0/scheduleform',function(S, Node, Base){
	function ScheduleForm(cfg) {
		var self = this;
		self.init();
		ScheduleForm.superclass.constructor.call(self, cfg);
	}

	S.extend(ScheduleForm, Base, {
		init: function() {
			var self = this;
			self.overlay = S.one(S.DOM.create("<div class=\"J_ScheduleForm schedule-form\"></div>"));
			S.one("body").append(self.overlay);
			self._addFrame();
			self._addEvent();
		},
		_addFrame: function() {
			var self = this;
			var frame = "<div class=\"J_FormArrow form-arrow\">"
				+ "<div class=\"arrow arrow-down\"></div>"
				+ "<div class=\"arrow arrow-up\"></div>"
				+ "</div><div class=\"J_FormBody form-body\"></div>"
				+ "<a href=\"javascript:;\" class=\"J_FormClose form-close\">X</a>";
			self.overlay.html(frame);
			self.closeEl = self.overlay.one(".J_FormClose");
			self.body = self.overlay.one(".J_FormBody");
		},
		_addEvent: function() {
			var self = this;
			self.closeEl.on("click", function(e){
				self.hide();
			});
		},
		setContent: function(con) {
			var self = this;
			var node = typeof con === "string" ? false : true;
			if (node) {
				con = S.one(con).html();
			}
			self.body.html(con);
		},
		showToTarget: function(target) {
			var self = this;
			var offset = target.offset();
			var size = {w: target.outerWidth(), h: target.outerHeight()};
			var oSize = {w: self.overlay.outerWidth(), h: self.overlay.outerHeight()};
			var wSize = {w: S.one(window).width(), h: S.one(window).height()};
			var css = {};
			css.left = offset.left + size.w + 5;
			css.top = offset.top + (size.h - oSize.h) / 2;
			if (css.left + oSize.w > wSize.w) {
				self.overlay.addClass("schedule-form-outside");
				css.left = offset.left - oSize.w - 5;
			} else {
				self.overlay.removeClass("schedule-form-outside");
			}
			self.overlay.css(css);
			self.show();
		},
		show: function() {
			var self = this;
			self.overlay.show();
		},
		hide: function(){
			var self = this;
			self.overlay.hide();
		}
	}, {ATTRS: {

	}});

	return ScheduleForm;
}, {requires: ['node', 'base']});
/**
 * @fileoverview kissy日程组件
 * @author Letao<mailzwj@126.com>
 * @module kschedule
 **/
KISSY.add('gallery/kschedule/1.0/index',function (S, Node, Base, Sizzle, Xtpl, SF) {
    var EMPTY = '';
    var $ = Node.all;
    /**
     * kissy日程组件
     * @class Kschedule
     * @constructor
     * @extends Base
     * @param container{String|HTMLElement} 日程组件将渲染至该节点
     * @param prev{String|HTMLElement} 上一周切换控制节点
     * @param next{String|HTMLElement} 下一周切换控制节点
     * @param today{String|HTMLElement} 切换至当天所在周
     * @param showWeekend{Boolean} 是否显示双休
     * @param rowHeight 单行高度，默认26
     * @param scrollTo{int} 指定初始滚动到的时间点取值范围0 ~ 23，默认9
     * @param highlight{Object} 高亮区域从几点到几点，为显示工作时间设置，默认{from: 9, to: 18}
     * @param save{String} 新增日程存储接口链接，要求以jsonp格式返回存储状态，包括记录id
     * @param read{String} 读取已有日程列表接口链接，要求返回jsonp数据
     * @param delete{String} 删除对应id的日程记录，要求以jsonp格式返回删除状态
     * @param update{String} 更新对应id的日程记录，要求以jsonp格式返回更新状态
     */
    function Kschedule(cfg) {
        var self = this;
        self.ctn = S.one(cfg.container);
        self.prev = S.one(cfg.prev);
        self.next = S.one(cfg.next);
        self.today = S.one(cfg.today);
        self.sw = cfg.showWeekend;
        self.rh = cfg.rowHeight || 26;
        self.scrollTo = cfg.scrollTo || 9;
        self.highlight = cfg.highlight || {from: 9, to: 18};
        self.save = cfg.save;
        self.read = cfg.read;
        self.delete = cfg.delete;
        self.update = cfg.update;
        self.scheduleform = new SF();
        self.timer = null;
        self.set("days", 7);
        self.set("msDay", 24 * 60 * 60 * 1000);
        self.set("halfHour", 48); // 24 * 2
        self.set("pxpermin", self.rh / 30);
        //调用父类构造函数
        Kschedule.superclass.constructor.call(self, cfg);
    }
    S.extend(Kschedule, Base, /** @lends Kschedule.prototype*/{
        render: function() {
            var self = this;
            var cur = new Date();
            if (!self.sw) {
                self.set("days", 5);
                self.set("colClass", "col-wide");
            }
            self.monday = self.getMonday(cur);
            self._createTable();
            self.schedule = self.ctn.one(".J_ScheduleBox");
            self.fields = self.ctn.one(".J_ScheduleContent");
            self.thead = self.ctn.one(".J_ScheduleHeader");
            self.tbody = self.ctn.one(".J_ScheduleBody");
            self.side = self.ctn.one(".J_ScheduleSide");
            self.line = self.ctn.one(".J_NowTime");
            self.cols = self.fields.all(".c-col");
            self.ths = self.thead.all(".h-days");
            self._fixHeight();
            self.today.attr("disabled", true);
            self.gotoWeek(self.monday);
            self._setNowLine();
            self._bindEvent();
            self._openDrag();
            self._formDelegate();
            self._enableCreate();
        },
        gotoWeek: function(mon) {
            var self = this;
            self._updateHeader(mon);
            if (self.read) {
                self._getSchedules(mon);
            }
        },
        getMonday: function(date) {
            var self = this;
            var fDay = date;
            var wDay = date.getDay();
            wDay = wDay == 0 ? 7 : wDay;
            fDay = new Date((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - (wDay - 1) * self.get("msDay")));
            return fDay;
        },
        fillDoub: function(num) {
            num = num < 10 ? "0" + num : num;
            return num;
        },
        formatHour: function(num) {
            var self = this;
            var h = 0, m = 0;
            h = self.fillDoub(Math.floor(num / 60));
            m = self.fillDoub(num % 60);
            return {h: h, m: m};
        },
        formatThead: function(date) {
            var self = this;
            var y = 0, m = 0, d = 0;
            var week = ["日", "一", "二", "三", "四", "五", "六"];
            y = self.fillDoub(date.getFullYear());
            m = self.fillDoub(date.getMonth() + 1);
            d = self.fillDoub(date.getDate());
            return {y: y, m: m, d: d, w: week[date.getDay()]};
        },
        isToday: function(date) {
            var self = this;
            var today = new Date();
            if (date.getFullYear() === today.getFullYear()
                && date.getMonth() === today.getMonth()
                && date.getDate() === today.getDate()) {
                return true;
            } else {
                return false;
            }
        },
        hasToday: function() {
            var self = this;
            var td = new Date();
            var tdis = td.getTime() - self.monday.getTime();
            if (tdis >= 0 && tdis < 7 * self.get("msDay")) {
                return true;
            } else {
                return false;
            }
        },
        hideLine: function() {
            var self = this;
            clearTimeout(self.timer);
            self.line.css("display", "none");
        },
        parseTime: function(time) {
            var self = this;
            var h = self.fillDoub(Math.floor(time / 60));
            var m = self.fillDoub(time % 60);
            return {h: h, m: m};
        },
        _formDelegate: function() {
            var self = this;
            self.scheduleform.overlay.delegate("click", ".J_Update", function(e){
                var sf = self.scheduleform.overlay.one(".J_FormElement");
                var url = sf.attr("action");
                S.io({
                    url: url,
                    data: S.io.serialize(sf),
                    dataType: "jsonp",
                    jsonp: "callback",
                    success: function(data){
                        if (data && data.success) {
                            self.currentTarget.one(".text-box").html(data.schedule.content);
                            self.currentTarget.one(".text-box").attr("title", data.schedule.content);
                            self.scheduleform.hide();
                        }
                    }
                });
                e.halt();
            });
            self.scheduleform.overlay.delegate("click", ".J_Delete", function(e){
                var url = self.delete;
                var did = self.scheduleform.overlay.one("input[name=id]").val();
                S.io({
                    url: url,
                    data: {"id": did},
                    dataType: "jsonp",
                    jsonp: "callback",
                    success: function(data){
                        if (data && data.success) {
                            self.currentTarget.remove();
                            self.scheduleform.setContent("");
                            self.scheduleform.hide();
                        }
                    }
                });
                e.halt();
            });
            self.scheduleform.overlay.delegate("click", ".J_Add", function(e){
                var sf = self.scheduleform.overlay.one(".J_FormElement");
                var url = sf.attr("action");
                S.io({
                    url: url,
                    data: S.io.serialize(sf),
                    dataType: "jsonp",
                    jsonp: "callback",
                    success: function(data){
                        if (data && data.success) {
                            self._addSchedule(data);
                        }
                    }
                });
                e.halt();
            });
        },
        _addSchedule: function(data) {
            var self = this;
            self.currentTarget.addClass("J_ScheduleBlock");
            self.currentTarget.attr("data-id", data.id);
            self.currentTarget.one(".text-box").html(data.content);
            self.scheduleform.hide();
        },
        _parseTime: function(row, col, obj, count) {
            var self = this;
            var start = null, end = null;
            start = self.formatHour(row * 30);
            end = self.formatHour((parseInt(row) + count) * 30);
            obj["date"] = self.monday.getTime() + col * self.get("msDay");
            obj["start-time"] = start.h + ":" + start.m;
            obj["end-time"] = end.h + ":" + end.m;
            return obj;
        },
        _enableCreate: function() {
            var self = this;
            var origin = {x: 0, y: 0};
            var move = {x: 0, y: 0};
            var proxy = {row: 0, col: 0};
            var css = {left: 0, top: 0};
            var rh = self.rh;
            var cw = self.get("colWidth") || S.one(self.cols[0]).outerWidth();
            var scd = self.get("scheTpl").schedule;
            var count = 0;
            var scdata = {"schedules": []};
            var scobj = {
                "id": "",
                "date": "",
                "start-time": "",
                "end-time": "",
                "content": "",
                "style": ""
            };
            self.fields.delegate("mousedown", ".c-item", function(e){
                var tar = S.one(e.target);
                var scp = self.fields.one(".J_ScheduleList");
                if (self.currentTarget && !self.currentTarget.hasClass("J_ScheduleBlock")) {
                    self.currentTarget.remove();
                }
                self.scheduleform.hide();
                origin.x = e.clientX;
                origin.y = e.clientY;
                proxy.row = parseInt(tar.attr("row"));
                proxy.col = parseInt(tar.attr("col"));
                count = 0;
                css.left = proxy.col * cw;
                css.top = proxy.row * rh;
                css.height = 0;
                css.width = cw - 5;
                scdata.schedules[0] = self._parseTime(proxy.row, proxy.col, scobj, count);
                self.currentTarget = S.one(S.DOM.create(new Xtpl(scd).render(scdata)));
                self.currentTarget.removeClass("J_ScheduleBlock").addClass("schedule-new");
                self.currentTarget.css(css);
                if (!scp) {
                    return false;
                }
                scp.append(self.currentTarget);
                self.fields.on("mousemove", function(e){
                    move.x = e.clientX;
                    move.y = e.clientY;
                    var dir = 1;
                    var dY = move.y - origin.y;
                    var obj = null;
                    if (Math.abs(dY) > self.rh / 2) {
                        dir = dY > 0 ? 1 : -1;
                        count += dir;
                        obj = self._parseTime(proxy.row, proxy.col, scobj, count);
                        css.height += self.rh * dir;
                        self.currentTarget.css("height", css.height);
                        self._writeNewSchedule(obj);
                        origin.y += self.rh * dir;
                    }
                });
                self.fields.on("mouseup", function(e){
                    self._editContent("add");
                    if (self.currentTarget.height() === 0) {
                        self.currentTarget.remove();
                        self.scheduleform.hide();
                    }
                    self.fields.detach("mousemove mouseup");
                });
            });
        },
        _writeNewSchedule: function(obj) {
            var self = this;
            var title = self.currentTarget.one(".time-bar");
            self.currentTarget.attr("data-start", obj["start-time"]);
            self.currentTarget.attr("data-end", obj["end-time"]);
            title.html(obj["start-time"] + " ~ " + obj["end-time"]);
        },
        _getSchedules: function(mon) {
            var self = this;
            var data = {
                monday: mon.getTime(),
                days: self.get("days")
            };
            S.io({
                url: self.read,
                data: data,
                dataType: "jsonp",
                jsonp: "callback",
                success: function(data) {
                    if (data && data.schedules && data.schedules.length > 0) {
                        self._writeData(data);
                    }
                }
            });
        },
        _writeData: function(data) {
            var self = this;
            var html = "";
            var stpl = self.get("scheTpl").schedule;
            var scp = self.fields.one(".J_ScheduleList");
            if (!scp) {
                scp = S.one(S.DOM.create("<div class=\"J_ScheduleList\"></div>"));
            }
            scp.html("");
            S.each(data.schedules, function(s, i){
                var col = self._getCol(s.date);
                var row = self._getRow(s["start-time"]);
                var height = self._getHeight(s["start-time"], s["end-time"]);
                var cw = self.get("colWidth") || S.one(self.cols[0]).width();
                var left = col * cw;
                var top = row * self.rh;
                s.style = "left:" + left + "px;top:" + top + "px;width:" + (cw - 5) + "px;height:" + height + "px";
            });
            html = new Xtpl(stpl).render(data);
            scp.html(html);
            self.fields.append(scp);
        },
        _getCol: function(msd) {
            var self = this;
            var dlen = parseInt(msd) - self.monday;
            var col = Math.floor(dlen / self.get("msDay"));
            return col;
        },
        _getRow: function(time) {
            var tsplit = time.split(":");
            var minute = parseInt(tsplit[0]) * 60 + parseInt(tsplit[1]);
            var row = minute / 30;
            return row;
        },
        _getHeight: function(stime, etime) {
            var self = this;
            var ssplit = stime.split(":");
            var esplit = etime.split(":");
            var mins = parseInt(ssplit[0]) * 60 + parseInt(ssplit[1]);
            var mine = parseInt(esplit[0]) * 60 + parseInt(esplit[1]);
            var mindis = mine - mins;
            var height = (mindis / 30) * self.rh;
            return height;
        },
        _createTable: function() {
            var self = this;
            var t = {"table": {
                header: "<li class=\"h-item h-empty\"></li>",
                side: "",
                content: ""
            }};
            var d = {
                header: {"hItem": []},
                side: {"sItem": []},
                content: {"cItem": []}
            };
            var sItems = "", aItems = [];
            for (var i = 0; i < self.get("halfHour"); i++) {
                var sSpan = "<span class=\"c-item c-item-odd{{highlight}}\" row=\"" + i + "\" col=\"{{col}}\"></span>";
                var rcls = "s-item-odd";
                if (i % 2 === 0) {
                    sSpan = "<span class=\"c-item c-item-even{{highlight}}\" row=\"" + i + "\" col=\"{{col}}\"></span>";
                    rcls = "s-item-even";
                }
                if (i >= (self.highlight.from * 2) && i < (self.highlight.to * 2)) {
                    sSpan = sSpan.replace(/\{\{highlight\}\}/g, " c-working");
                } else {
                    sSpan = sSpan.replace(/\{\{highlight\}\}/g, "");
                }
                var hours = self.formatHour(i * 30);
                d.side.sItem.push({"text": hours.h + ":" + hours.m, "rowCls": rcls});
                aItems.push(sSpan);
            }
            sItems = aItems.join("");
            for (var i = 0; i < self.get("days"); i++) {
                var curDay = new Date(self.monday.getTime() + i * self.get("msDay"));
                var isToday = self.isToday(curDay);
                var dn = self.formatThead(curDay);
                d.header.hItem.push({"text": dn.m + "月" + dn.d + "日（" + dn.w + "）", "today": isToday, "colWidth": self.get("colClass")});
                d.content.cItem.push({"items": sItems.replace(/\{\{col\}\}/g, i), "today": isToday, "colWidth": self.get("colClass")});
            }
            var tpls = self.get("scheTpl");
            t.table.header += new Xtpl(tpls.hItem).render(d.header);
            t.table.side += new Xtpl(tpls.sItem).render(d.side);
            t.table.content += new Xtpl(tpls.cItem).render(d.content);
            var table = new Xtpl(tpls.box).render(t);
            self.ctn.html(table);
        },
        _fixHeight: function() {
            var self = this;
            var iHeight = self.ctn.height();
            var iHeaderHeight = self.thead.height();
            var st = self.scrollTo * 2 * self.rh;
            self.tbody.css({"height": iHeight - iHeaderHeight, "overflowX": "hidden", "overflowY": "auto"});
            self.thead.css({"width": self.side.width() + self.fields.width()});
            self.tbody.scrollTop(st);
        },
        _setNowLine: function() {
            var self = this;
            var tDate = new Date();
            var tIndex = tDate.getDay();
            var now = tDate.getHours() * 60 + tDate.getMinutes();
            var pxpermin = self.get("pxpermin");
            tIndex = tIndex === 0 ? 7 : tIndex;
            tIndex -= 1;
            var colWidth = S.one(self.cols[0]).width();
            var left = tIndex * colWidth;
            var top = pxpermin * now - 1;
            self.set("colWidth", colWidth);
            if (tIndex < self.get("days")) {
                self.line.css({"display": "block", "left": left, "top": top, "width": colWidth});
                self.timer = setTimeout(function(){
                    self._setNowLine();
                }, 1000);
            } else {
                self.hideLine();
            }
        },
        _updateHeader: function(mon) {
            var self = this;
            var td = new Date().getDay();
            td = td === 0 ? 7 : td;
            td -= 1;
            var hd = S.one(self.ths[td]);
            var cd = S.one(self.cols[td])
            self.ths.each(function(day, i){
                var date = self.formatThead(new Date(mon.getTime() + i * self.get("msDay")));
                day.html(date.m + "月" + date.d + "日（" + date.w + "）");
            });
            if (!hd) {
                return;
            }
            if (self.hasToday()) {
                hd.addClass("h-today");
                cd.addClass("c-today");
            } else {
                hd.removeClass("h-today");
                cd.removeClass("c-today");
            }
        },
        _bindEvent: function() {
            var self = this;
            self.prev.on("click", function(e){
                self.monday = new Date(self.monday.getTime() - 7 * self.get("msDay"));
                self.gotoWeek(self.monday);

                if (self.hasToday()) {
                    self.today.attr("disabled", true);
                    self._setNowLine();
                } else {
                    self.today.removeAttr("disabled");
                    self.hideLine();
                }
            });
            self.next.on("click", function(e){
                self.monday = new Date(self.monday.getTime() + 7 * self.get("msDay"));
                self.gotoWeek(self.monday);

                if (self.hasToday()) {
                    self.today.attr("disabled", true);
                    clearTimeout(self.timer);
                    self._setNowLine();
                } else {
                    self.today.removeAttr("disabled");
                    self.hideLine();
                }
            });
            self.today.on("click", function(e){
                var td = new Date();
                self.monday = self.getMonday(td);
                self.gotoWeek(self.monday);
                self.today.attr("disabled", true);
                clearTimeout(self.timer);
                self._setNowLine();
            });
        },
        _getMinutes: function(time) {
            var self = this;
            var tsp = time.split(":");
            var minute = parseInt(tsp[0]) * 60 + parseInt(tsp[1]);
            return minute;
        },
        _updateTime: function(ds) {
            var self = this;
            var pxpermin = self.get("pxpermin");
            var tb = self.currentTarget.one(".time-bar");
            var stime = self._getMinutes(self.currentTarget.attr("data-start")) + ds / pxpermin;
            var etime = self._getMinutes(self.currentTarget.attr("data-end")) + ds / pxpermin;
            var ost = self.parseTime(stime);
            var ose = self.parseTime(etime);
            self.currentTarget.attr("data-start", ost.h + ":" + ost.m);
            self.currentTarget.attr("data-end", ose.h + ":" + ose.m);
            tb.html(ost.h + ":" + ost.m + " ~ " + ose.h + ":" + ose.m);
        },
        _updateDate: function(dir) {
            var self = this;
            var sdate = self.currentTarget.attr("data-date");
            var odate = parseInt(sdate) + dir * self.get("msDay");
            self.currentTarget.attr("data-date", odate);
        },
        _isOutside: function(dis, dir) {
            var self = this;
            var side_top = 0,
                side_left = 0,
                side_bottom = self.fields.height() - self.currentTarget.height(),
                side_right = self.fields.width() - self.currentTarget.width();
            if (dir === "h") {
                if (dis < side_left || dis > side_right) {
                    return true;
                } else {
                    return false;
                }
            } else if (dir === "v") {
                if (dis < side_top || dis > side_bottom) {
                    return true;
                } else {
                    return false;
                }
            }
        },
        _sendUpdate: function(data, os) {
            var self = this;
            S.io({
                url: self.update,
                data: data,
                dataType: "jsonp",
                jsonp: "callback",
                success: function(data) {
                    if (data && data.success) {
                        //
                    } else {
                        self.currentTarget.attr("data-date", os.date);
                        self.currentTarget.attr("data-start", os.stime);
                        self.currentTarget.attr("data-end", os.etime);
                        self.currentTarget.attr("style", os.style);
                    }
                }
            })
        },
        _openDrag: function() {
            var self = this;
            var start = {x: 0, y: 0},
                move = {x: 0, y: 0},
                timedis = 0,
                movedis = {x: 0, y: 0},
                dirY = 1,
                dirX = 1;
            self.fields.delegate("mousedown", ".J_ScheduleBlock", function(e){
                var target = S.one(e.target);
                target = target.hasClass(".J_ScheduleBlock") ? target : target.parent(".J_ScheduleBlock");
                var initData = {
                    date: target.attr("data-date"),
                    stime: target.attr("data-start"),
                    etime: target.attr("data-end"),
                    style: target.attr("style")
                };
                var initLeft = target.css("left");
                var initTop = target.css("top");
                if (self.currentTarget && !self.currentTarget.hasClass("J_ScheduleBlock")) {
                    self.currentTarget.remove();
                }
                self.currentTarget = target;
                start.x = e.clientX;
                start.y = e.clientY;
                timedis = self._getMinutes(target.attr("data-end")) - self._getMinutes(target.attr("data-start"));
                // console.log(timedis);
                self.fields.on("mousemove", function(e){
                    move.x = e.clientX;
                    move.y = e.clientY;
                    movedis.x = move.x - start.x;
                    movedis.y = move.y - start.y;
                    if (Math.abs(movedis.y) > self.rh / 2) {
                        dirY = movedis.y > 0 ? 1 : -1;
                        var dsv = dirY * self.rh;
                        var destTop = parseFloat(self.currentTarget.css("top")) + dsv;
                        if (!self._isOutside(destTop, "v")) {
                            self.currentTarget.css("top", destTop);
                            start.y += dsv;
                            self._updateTime(dsv);
                        }
                    }
                    if (Math.abs(movedis.x) > self.get("colWidth") / 2) {
                        dirX = movedis.x > 0 ? 1 : -1;
                        var dsh = dirX * self.get("colWidth");
                        var destLeft = parseFloat(self.currentTarget.css("left")) + dsh;
                        if (!self._isOutside(destLeft, "h")) {
                            self.currentTarget.css("left", destLeft);
                            start.x += dsh;
                            self._updateDate(dirX);
                        }
                    }
                });
                self.fields.on("mouseup", function(e){
                    var data = {};
                    var endLeft = self.currentTarget.css("left");
                    var endTop = self.currentTarget.css("top");
                    if (initLeft != endLeft || initTop != endTop) {
                        data.id = self.currentTarget.attr("data-id");
                        data.date = self.currentTarget.attr("data-date");
                        data.stime = self.currentTarget.attr("data-start");
                        data.etime = self.currentTarget.attr("data-end");
                        data.content = self.currentTarget.one(".text-box").html();
                        self._sendUpdate(data, initData);
                    } else {
                        self._editContent("update");
                    }
                    self.fields.detach("mousemove mouseup");
                });
            });
        },
        _editContent: function(act) {
            var self = this;
            var ftpl = self.get("formTpl");
            var form = "";
            var obj = {
                action: self.save,
                id: "",
                date: self.currentTarget.attr("data-date"),
                stime: self.currentTarget.attr("data-start"),
                etime: self.currentTarget.attr("data-end"),
                content: "",
                btns: ftpl.add
            };
            if (act === "update") {
                obj.action = self.update;
                obj.id = self.currentTarget.attr("data-id");
                obj.content = self.currentTarget.one(".text-box").html();
                obj.btns = ftpl.update + ftpl.del;
            }
            form = new Xtpl(ftpl.form).render(obj);
            self.scheduleform.setContent(form);
            self.scheduleform.showToTarget(self.currentTarget);
        }
    }, {ATTRS : /** @lends Kschedule*/{
        colClass: {
            value: "col-narrow"
        },
        scheTpl: {
            value: {
                box: "{{#table}}<div class=\"J_ScheduleBox schedule-box\">"
                    + "<ul class=\"J_ScheduleHeader schedule-header clearfix\">{{{header}}}</ul>"
                    + "<div class=\"J_ScheduleBody schedule-body clearfix\">"
                    + "<div class=\"J_ScheduleSide schedule-side\">{{{side}}}</div>"
                    + "<div class=\"J_ScheduleContent schedule-content clearfix\">{{{content}}}<div class=\"J_NowTime now-time\"></div></div>"
                    + "</div>"
                    + "</div>{{/table}}",
                hItem: "{{#each hItem}}<li class=\"h-item h-days {{colWidth}}{{#if today}} h-today{{/if}}\">{{text}}</li>{{/each}}",
                sItem: "{{#each sItem}}<span class=\"s-item {{rowCls}}\">{{text}}</span>{{/each}}",
                cItem: "{{#each cItem}}<div class=\"c-col c-days {{colWidth}}{{#if today}} c-today{{/if}}\">{{{items}}}</div>{{/each}}",
                schedule: "{{#each schedules}}<div class=\"J_ScheduleBlock schedule-block\" data-id=\"{{id}}\" data-date=\"{{date}}\" data-start=\"{{start-time}}\" data-end=\"{{end-time}}\" style=\"{{style}}\">"
                    + "<h3 class=\"time-bar\">{{start-time}} ~ {{end-time}}</h3>"
                    + "<div class=\"text-box\" title=\"{{content}}\">{{content}}</div>"
                    + "</div>{{/each}}"
            }
        },
        formTpl: {
            value: {
                form: "<form class=\"J_FormElement form-element\" action=\"{{action}}\">"
                    + "<input type=\"hidden\" name=\"id\" value=\"{{id}}\">"
                    + "<input type=\"hidden\" name=\"date\" value=\"{{date}}\">"
                    + "<input type=\"hidden\" name=\"stime\" value=\"{{stime}}\">"
                    + "<input type=\"hidden\" name=\"etime\" value=\"{{etime}}\">"
                    + "<textarea class=\"schedule-main\" name=\"content\" row=\"6\" col=\"60\" placeholder=\"请填写日程内容\">{{content}}</textarea>"
                    + "<div class=\"J_OverlayAction overlay-action\">{{{btns}}}</div>"
                    + "</form>",
                update: "<input type=\"submit\" class=\"J_Update btn btn-update\" value=\"更新\">",
                add: "<input type=\"submit\" class=\"J_Add btn btn-add\" value=\"保存\">",
                del: "<input type=\"button\" class=\"J_Delete btn btn-delete\" value=\"删除\">"
            }
        }
    }});
    return Kschedule;
}, {requires:['node', 'base', 'sizzle', 'xtemplate', './scheduleform']});




