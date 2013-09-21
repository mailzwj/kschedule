KISSY.add(function(S, Node, Base){
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