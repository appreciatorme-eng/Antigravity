#!/usr/bin/env python3
"""Generate the TravelSuite Agency Scaling Blueprint lead magnet PDF.

A premium 19-page guide built with custom flowables, illustrations,
and professional typography. Designed as a genuine value-first resource
for Indian tour operators, with subtle TravelSuite positioning.
"""

import math
import os
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Flowable, NextPageTemplate, PageTemplate, Frame, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth

# ─── Color Palette ───
CYAN = HexColor("#00C9D6")
CYAN_DARK = HexColor("#0097A7")
CYAN_LIGHT = HexColor("#E0F7FA")
CYAN_BG = HexColor("#F0FDFA")
ORANGE = HexColor("#F97316")
ORANGE_LIGHT = HexColor("#FFF7ED")
ORANGE_BG = HexColor("#FFFBEB")
DARK_BG = HexColor("#0F172A")
DARK_CARD = HexColor("#1E293B")
SLATE_700 = HexColor("#334155")
SLATE_500 = HexColor("#64748B")
SLATE_400 = HexColor("#94A3B8")
SLATE_200 = HexColor("#E2E8F0")
SLATE_100 = HexColor("#F1F5F9")
SLATE_50 = HexColor("#F8FAFC")
TEXT_DARK = HexColor("#0F172A")
TEXT_BODY = HexColor("#334155")
TEXT_MUTED = HexColor("#64748B")
GREEN = HexColor("#059669")
GREEN_LIGHT = HexColor("#ECFDF5")
RED = HexColor("#DC2626")
RED_LIGHT = HexColor("#FEF2F2")
PURPLE = HexColor("#7C3AED")
PURPLE_LIGHT = HexColor("#F5F3FF")
BLUE = HexColor("#2563EB")

W, H = A4  # 595.27 x 841.89
LM = 52
RM = 52
CW = W - LM - RM  # ~491

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "The-2024-Agency-Scaling-Blueprint.pdf")


# ═══════════════════════════════════════════════
# ILLUSTRATION FLOWABLES
# ═══════════════════════════════════════════════

class PlaneIllustration(Flowable):
    """A stylized paper airplane with dotted trail."""
    def __init__(self, width=80, height=60, color=CYAN):
        super().__init__()
        self.w = width
        self.h = height
        self.color = color

    def wrap(self, aw, ah):
        return self.w, self.h

    def draw(self):
        c = self.canv
        c.saveState()
        cx, cy = self.w * 0.7, self.h * 0.5
        c.setFillColor(self.color)
        c.setStrokeColor(self.color)
        c.setLineWidth(1.5)
        p = c.beginPath()
        p.moveTo(cx, cy)
        p.lineTo(cx - 28, cy + 12)
        p.lineTo(cx - 20, cy)
        p.lineTo(cx - 28, cy - 12)
        p.close()
        c.drawPath(p, fill=1, stroke=0)
        c.setDash(3, 4)
        c.setLineWidth(1)
        c.setStrokeColor(Color(self.color.red, self.color.green, self.color.blue, 0.4))
        p2 = c.beginPath()
        p2.moveTo(cx - 30, cy)
        p2.curveTo(cx - 50, cy + 15, cx - 65, cy - 10, cx - 75, cy + 5)
        c.drawPath(p2, fill=0, stroke=1)
        c.restoreState()


class GlobeIllustration(Flowable):
    """A stylized globe with latitude/longitude lines."""
    def __init__(self, size=70, color=CYAN):
        super().__init__()
        self.size = size
        self.color = color

    def wrap(self, aw, ah):
        return self.size, self.size

    def draw(self):
        c = self.canv
        c.saveState()
        r = self.size * 0.4
        cx = self.size / 2
        cy = self.size / 2
        c.setFillColor(Color(self.color.red, self.color.green, self.color.blue, 0.08))
        c.circle(cx, cy, r + 4, fill=1, stroke=0)
        c.setStrokeColor(self.color)
        c.setLineWidth(1.8)
        c.setFillColor(Color(self.color.red, self.color.green, self.color.blue, 0.12))
        c.circle(cx, cy, r, fill=1, stroke=1)
        c.setLineWidth(0.7)
        c.setStrokeColor(Color(self.color.red, self.color.green, self.color.blue, 0.5))
        c.ellipse(cx - r * 0.4, cy - r, cx + r * 0.4, cy + r, fill=0, stroke=1)
        c.line(cx - r, cy, cx + r, cy)
        c.line(cx, cy - r, cx, cy + r)
        offsets = [r * 0.55, -r * 0.55]
        for off in offsets:
            c.line(cx - r * 0.85, cy + off, cx + r * 0.85, cy + off)
        c.restoreState()


class ChartIllustration(Flowable):
    """A mini bar chart showing growth."""
    def __init__(self, width=120, height=70, color=GREEN):
        super().__init__()
        self.w = width
        self.h = height
        self.color = color

    def wrap(self, aw, ah):
        return self.w, self.h

    def draw(self):
        c = self.canv
        c.saveState()
        bars = [0.3, 0.45, 0.4, 0.6, 0.55, 0.75, 0.85, 0.95]
        bar_w = self.w / (len(bars) * 1.8)
        gap = bar_w * 0.8
        base_y = 8
        max_h = self.h - 20
        for i, val in enumerate(bars):
            x = 8 + i * (bar_w + gap)
            h = val * max_h
            alpha = 0.3 + val * 0.5
            c.setFillColor(Color(self.color.red, self.color.green, self.color.blue, alpha))
            c.roundRect(x, base_y, bar_w, h, 2, fill=1, stroke=0)
        c.setStrokeColor(Color(self.color.red, self.color.green, self.color.blue, 0.3))
        c.setLineWidth(1.5)
        c.setDash([], 0)
        pts = [(8 + i * (bar_w + gap) + bar_w / 2, base_y + v * max_h) for i, v in enumerate(bars)]
        p = c.beginPath()
        p.moveTo(pts[0][0], pts[0][1])
        for px, py in pts[1:]:
            p.lineTo(px, py)
        c.drawPath(p, fill=0, stroke=1)
        c.restoreState()


class WhatsAppIcon(Flowable):
    """Stylized WhatsApp chat bubble icon."""
    def __init__(self, size=50, color=GREEN):
        super().__init__()
        self.size = size
        self.color = color

    def wrap(self, aw, ah):
        return self.size, self.size

    def draw(self):
        c = self.canv
        c.saveState()
        cx, cy = self.size / 2, self.size / 2 + 4
        r = self.size * 0.35
        c.setFillColor(Color(self.color.red, self.color.green, self.color.blue, 0.1))
        c.circle(cx, cy, r + 5, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.circle(cx, cy, r, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", self.size * 0.3)
        c.drawCentredString(cx, cy - self.size * 0.1, "W")
        c.setFillColor(self.color)
        p = c.beginPath()
        p.moveTo(cx - r * 0.3, cy - r)
        p.lineTo(cx - r * 0.6, cy - r - 8)
        p.lineTo(cx + r * 0.1, cy - r)
        c.drawPath(p, fill=1, stroke=0)
        c.restoreState()


class RupeeIcon(Flowable):
    """Stylized Rupee symbol in a circle."""
    def __init__(self, size=50, color=ORANGE):
        super().__init__()
        self.size = size
        self.color = color

    def wrap(self, aw, ah):
        return self.size, self.size

    def draw(self):
        c = self.canv
        c.saveState()
        cx, cy = self.size / 2, self.size / 2
        r = self.size * 0.38
        c.setFillColor(Color(self.color.red, self.color.green, self.color.blue, 0.1))
        c.circle(cx, cy, r + 4, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.circle(cx, cy, r, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", self.size * 0.42)
        c.drawCentredString(cx + 1, cy - self.size * 0.13, "R")
        c.restoreState()


class RoadmapIllustration(Flowable):
    """A winding road/path with milestone dots."""
    def __init__(self, width=CW, height=50, color=CYAN_DARK):
        super().__init__()
        self.w = width
        self.h = height
        self.color = color

    def wrap(self, aw, ah):
        return self.w, self.h

    def draw(self):
        c = self.canv
        c.saveState()
        c.setStrokeColor(Color(self.color.red, self.color.green, self.color.blue, 0.25))
        c.setLineWidth(3)
        c.setDash(8, 5)
        p = c.beginPath()
        p.moveTo(20, self.h / 2)
        p.curveTo(self.w * 0.25, self.h * 0.8, self.w * 0.35, self.h * 0.2,
                  self.w * 0.5, self.h / 2)
        p.curveTo(self.w * 0.65, self.h * 0.8, self.w * 0.75, self.h * 0.2,
                  self.w - 20, self.h / 2)
        c.drawPath(p, fill=0, stroke=1)
        dots = [
            (self.w * 0.15, self.h * 0.58, CYAN_DARK, "Start"),
            (self.w * 0.38, self.h * 0.35, ORANGE, "Month 1"),
            (self.w * 0.62, self.h * 0.65, GREEN, "Month 2"),
            (self.w * 0.85, self.h * 0.48, PURPLE, "Month 3"),
        ]
        for dx, dy, dc, label in dots:
            c.setFillColor(dc)
            c.circle(dx, dy, 6, fill=1, stroke=0)
            c.setFillColor(white)
            c.circle(dx, dy, 2.5, fill=1, stroke=0)
            c.setFillColor(dc)
            c.setFont("Helvetica-Bold", 7)
            c.drawCentredString(dx, dy - 14, label)
        c.restoreState()


class SectionDivider(Flowable):
    """A decorative section divider with icon."""
    def __init__(self, width=CW, icon_char=None, color=CYAN_DARK):
        super().__init__()
        self.w = width
        self.color = color
        self.icon = icon_char

    def wrap(self, aw, ah):
        return self.w, 20

    def draw(self):
        c = self.canv
        c.saveState()
        y = 10
        c.setStrokeColor(Color(self.color.red, self.color.green, self.color.blue, 0.2))
        c.setLineWidth(0.8)
        if self.icon:
            mid = self.w / 2
            c.line(0, y, mid - 20, y)
            c.line(mid + 20, y, self.w, y)
            c.setFillColor(self.color)
            c.circle(mid, y, 10, fill=0, stroke=1)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(mid, y - 3.5, self.icon)
        else:
            c.line(0, y, self.w, y)
        c.restoreState()


class PillarCard(Flowable):
    """A styled pillar/feature card with icon circle, title, body, and before/after."""
    def __init__(self, number, title, body_text, old_way, new_way, color, width=CW):
        super().__init__()
        self.number = str(number)
        self.title = title
        self.body_text = body_text
        self.old_way = old_way
        self.new_way = new_way
        self.color = color
        self.card_width = width
        body_lines = self._wrap(body_text, width - 65, "Helvetica", 9.5)
        old_lines = self._wrap("Before: " + old_way, width - 80, "Helvetica", 9)
        new_lines = self._wrap("After: " + new_way, width - 80, "Helvetica", 9)
        self.card_height = 50 + len(body_lines) * 14 + len(old_lines) * 13 + len(new_lines) * 13 + 30

    @staticmethod
    def _wrap(text, max_w, font, size):
        words = text.split()
        lines, cur = [], ""
        for w in words:
            test = cur + " " + w if cur else w
            if stringWidth(test, font, size) < max_w:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    def wrap(self, aw, ah):
        return self.card_width, self.card_height

    def draw(self):
        c = self.canv
        c.saveState()
        # Card background
        c.setFillColor(Color(self.color.red, self.color.green, self.color.blue, 0.04))
        c.setStrokeColor(Color(self.color.red, self.color.green, self.color.blue, 0.15))
        c.setLineWidth(1)
        c.roundRect(0, 0, self.card_width, self.card_height, 8, fill=1, stroke=1)
        # Left accent bar
        c.setFillColor(self.color)
        c.roundRect(0, 0, 4, self.card_height, 2, fill=1, stroke=0)
        # Number circle
        c.setFillColor(self.color)
        c.circle(28, self.card_height - 25, 14, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(28, self.card_height - 30, self.number)
        # Title
        c.setFillColor(self.color)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(50, self.card_height - 30, self.title)
        # Body
        c.setFillColor(TEXT_BODY)
        c.setFont("Helvetica", 9.5)
        y = self.card_height - 50
        for line in self._wrap(self.body_text, self.card_width - 65, "Helvetica", 9.5):
            c.drawString(18, y, line)
            y -= 14
        y -= 8
        # Before/After
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(28, y, "BEFORE")
        y -= 14
        c.setFillColor(TEXT_MUTED)
        c.setFont("Helvetica", 9)
        for line in self._wrap(self.old_way, self.card_width - 80, "Helvetica", 9):
            c.drawString(28, y, line)
            y -= 13
        y -= 5
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(28, y, "AFTER")
        y -= 14
        c.setFillColor(TEXT_BODY)
        c.setFont("Helvetica-Bold", 9)
        for line in self._wrap(self.new_way, self.card_width - 80, "Helvetica-Bold", 9):
            c.drawString(28, y, line)
            y -= 13
        c.restoreState()


class StatRow(Flowable):
    """A row of stat cards with big numbers."""
    def __init__(self, stats, width=CW, height=80):
        super().__init__()
        self.stats = stats  # [(number, label, color), ...]
        self.total_width = width
        self.h = height

    def wrap(self, aw, ah):
        return self.total_width, self.h

    def draw(self):
        c = self.canv
        c.saveState()
        n = len(self.stats)
        card_w = (self.total_width - (n - 1) * 12) / n
        for i, (num, label, color) in enumerate(self.stats):
            x = i * (card_w + 12)
            c.setFillColor(Color(color.red, color.green, color.blue, 0.06))
            c.roundRect(x, 0, card_w, self.h, 8, fill=1, stroke=0)
            c.setStrokeColor(Color(color.red, color.green, color.blue, 0.15))
            c.setLineWidth(1)
            c.roundRect(x, 0, card_w, self.h, 8, fill=0, stroke=1)
            c.setFillColor(color)
            c.setFont("Helvetica-Bold", 26)
            c.drawCentredString(x + card_w / 2, self.h - 38, num)
            c.setFillColor(TEXT_MUTED)
            c.setFont("Helvetica", 9)
            c.drawCentredString(x + card_w / 2, self.h - 56, label)
        c.restoreState()


class CalloutBox(Flowable):
    """A paragraph-aware callout box that wraps text properly."""
    def __init__(self, label, text, width, accent_color, bg_color, label_icon=None):
        super().__init__()
        self.label = label
        self.text = text
        self.bw = width
        self.accent = accent_color
        self.bg = bg_color
        self.icon = label_icon or ""
        lines = self._wrap(text, width - 36, "Helvetica", 9.5)
        self.bh = 18 + 18 + len(lines) * 14 + 12

    @staticmethod
    def _wrap(text, max_w, font, size):
        words = text.split()
        lines, cur = [], ""
        for w in words:
            test = cur + " " + w if cur else w
            if stringWidth(test, font, size) < max_w:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    def wrap(self, aw, ah):
        return self.bw, self.bh

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(self.bg)
        c.roundRect(0, 0, self.bw, self.bh, 6, fill=1, stroke=0)
        c.setFillColor(self.accent)
        c.roundRect(0, 0, 4, self.bh, 2, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(14, self.bh - 16, f"{self.icon} {self.label}".strip())
        c.setFillColor(TEXT_BODY)
        c.setFont("Helvetica", 9.5)
        y = self.bh - 34
        for line in self._wrap(self.text, self.bw - 36, "Helvetica", 9.5):
            c.drawString(14, y, line)
            y -= 14
        c.restoreState()


class MessageTemplate(Flowable):
    """A WhatsApp-style message template bubble."""
    def __init__(self, number, title, trigger, template_text, width=CW):
        super().__init__()
        self.number = str(number)
        self.title = title
        self.trigger = trigger
        self.template = template_text
        self.bw = width
        tmpl_lines = self._wrap(template_text, width - 60, "Helvetica", 9)
        self.bh = 26 + len(tmpl_lines) * 13 + 16

    @staticmethod
    def _wrap(text, max_w, font, size):
        words = text.split()
        lines, cur = [], ""
        for w in words:
            test = cur + " " + w if cur else w
            if stringWidth(test, font, size) < max_w:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    def wrap(self, aw, ah):
        return self.bw, self.bh

    def draw(self):
        c = self.canv
        c.saveState()
        # Bubble background
        c.setFillColor(GREEN_LIGHT)
        c.roundRect(30, 0, self.bw - 30, self.bh, 8, fill=1, stroke=0)
        # Green accent dot
        c.setFillColor(GREEN)
        c.circle(12, self.bh - 13, 8, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(12, self.bh - 17, self.number)
        # Title + trigger
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(42, self.bh - 16, self.title)
        tw = stringWidth(self.title, "Helvetica-Bold", 10)
        c.setFillColor(TEXT_MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(42 + tw + 10, self.bh - 15, f"({self.trigger})")
        # Template text
        c.setFillColor(TEXT_BODY)
        c.setFont("Helvetica", 9)
        y = self.bh - 34
        for line in self._wrap(self.template, self.bw - 60, "Helvetica", 9):
            c.drawString(42, y, line)
            y -= 13
        c.restoreState()


class AddonRow(Flowable):
    """Compact add-on item with rank, name, margin, demand."""
    def __init__(self, rank, name, price, margin, demand, width=CW):
        super().__init__()
        self.rank = str(rank)
        self.name = name
        self.price = price
        self.margin = margin
        self.demand = demand
        self.bw = width

    def wrap(self, aw, ah):
        return self.bw, 28

    def draw(self):
        c = self.canv
        c.saveState()
        y = 7
        # Alternating bg
        if int(self.rank) % 2 == 0:
            c.setFillColor(SLATE_50)
            c.rect(0, 0, self.bw, 28, fill=1, stroke=0)
        # Rank
        c.setFillColor(ORANGE)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(16, y, self.rank)
        # Name
        c.setFillColor(TEXT_DARK)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(35, y, self.name)
        # Price
        c.setFillColor(TEXT_BODY)
        c.setFont("Helvetica", 9)
        c.drawString(220, y, self.price)
        # Margin
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(340, y, self.margin)
        # Demand
        c.setFillColor(TEXT_MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(420, y, self.demand)
        c.restoreState()


class CheckItem(Flowable):
    """A styled checkbox item."""
    def __init__(self, text, width=CW, checked=False, bold=False):
        super().__init__()
        self.text = text
        self.bw = width
        self.checked = checked
        self.bold = bold

    def wrap(self, aw, ah):
        return self.bw, 20

    def draw(self):
        c = self.canv
        c.saveState()
        y = 4
        if self.checked:
            c.setFillColor(GREEN)
            c.circle(8, y + 5, 7, fill=1, stroke=0)
            c.setStrokeColor(white)
            c.setLineWidth(1.5)
            c.line(4.5, y + 5, 7, y + 2.5)
            c.line(7, y + 2.5, 11.5, y + 7.5)
        else:
            c.setStrokeColor(SLATE_400)
            c.setLineWidth(1)
            c.roundRect(2, y, 13, 13, 2, fill=0, stroke=1)
        font = "Helvetica-Bold" if self.bold else "Helvetica"
        c.setFillColor(TEXT_BODY)
        c.setFont(font, 10)
        c.drawString(22, y + 1, self.text)
        c.restoreState()


class NumberCircleStep(Flowable):
    """A step with circle number, title, description."""
    def __init__(self, number, title, desc, width=CW, color=CYAN_DARK):
        super().__init__()
        self.number = str(number)
        self.title = title
        self.desc = desc
        self.bw = width
        self.color = color
        lines = self._wrap(desc, width - 55, "Helvetica", 9.5)
        self.bh = max(38, 18 + len(lines) * 14)

    @staticmethod
    def _wrap(text, max_w, font, size):
        words = text.split()
        lines, cur = [], ""
        for w in words:
            test = cur + " " + w if cur else w
            if stringWidth(test, font, size) < max_w:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    def wrap(self, aw, ah):
        return self.bw, self.bh

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(self.color)
        c.circle(16, self.bh - 14, 12, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(16, self.bh - 18, self.number)
        c.setFillColor(TEXT_DARK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(38, self.bh - 18, self.title)
        c.setFillColor(TEXT_BODY)
        c.setFont("Helvetica", 9.5)
        y = self.bh - 34
        for line in self._wrap(self.desc, self.bw - 55, "Helvetica", 9.5):
            c.drawString(38, y, line)
            y -= 14
        c.restoreState()


# ═══════════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════════

def S():
    """Return all paragraph styles."""
    return {
        "h1": ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=22, leading=28,
                             textColor=TEXT_DARK, spaceAfter=8, spaceBefore=4),
        "h2": ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=15, leading=20,
                             textColor=TEXT_DARK, spaceAfter=6, spaceBefore=12),
        "h3": ParagraphStyle("H3", fontName="Helvetica-Bold", fontSize=12, leading=17,
                             textColor=TEXT_DARK, spaceAfter=4, spaceBefore=8),
        "body": ParagraphStyle("Body", fontName="Helvetica", fontSize=10, leading=16,
                               textColor=TEXT_BODY, alignment=TA_JUSTIFY, spaceAfter=8),
        "body_bold": ParagraphStyle("BodyBold", fontName="Helvetica-Bold", fontSize=10, leading=16,
                                     textColor=TEXT_DARK, spaceAfter=6),
        "small": ParagraphStyle("Small", fontName="Helvetica", fontSize=8, leading=11,
                                textColor=TEXT_MUTED, spaceAfter=4),
        "bullet": ParagraphStyle("Bullet", fontName="Helvetica", fontSize=10, leading=16,
                                 textColor=TEXT_BODY, leftIndent=18, spaceAfter=3,
                                 bulletIndent=6, bulletFontSize=10),
        "center": ParagraphStyle("Center", fontName="Helvetica", fontSize=10, leading=16,
                                 textColor=TEXT_BODY, alignment=TA_CENTER, spaceAfter=8),
        "center_bold": ParagraphStyle("CenterBold", fontName="Helvetica-Bold", fontSize=13, leading=18,
                                      textColor=TEXT_DARK, alignment=TA_CENTER, spaceAfter=6),
        "quote": ParagraphStyle("Quote", fontName="Helvetica-Oblique", fontSize=11, leading=17,
                                textColor=CYAN_DARK, alignment=TA_CENTER, leftIndent=25, rightIndent=25,
                                spaceBefore=8, spaceAfter=8),
        "toc_num": ParagraphStyle("TocNum", fontName="Helvetica-Bold", fontSize=16, leading=24,
                                  textColor=CYAN_DARK),
        "toc_title": ParagraphStyle("TocTitle", fontName="Helvetica-Bold", fontSize=12, leading=17,
                                    textColor=TEXT_DARK),
        "toc_desc": ParagraphStyle("TocDesc", fontName="Helvetica", fontSize=9, leading=13,
                                   textColor=TEXT_MUTED),
        "chapter_label": ParagraphStyle("ChapterLabel", fontName="Helvetica-Bold", fontSize=11,
                                        leading=14, textColor=CYAN_DARK, spaceAfter=2),
    }


# ═══════════════════════════════════════════════
# PAGE BACKGROUNDS
# ═══════════════════════════════════════════════

def draw_cover(c, doc):
    w, h = A4
    c.saveState()
    # Dark background
    c.setFillColor(DARK_BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    # Subtle gradient circles
    for cx_off, cy_off, radius, alpha in [
        (w * 0.8, h * 0.75, 280, 0.04), (w * 0.15, h * 0.25, 200, 0.03),
        (w * 0.5, h * 0.5, 160, 0.025), (w * 0.9, h * 0.2, 120, 0.02),
    ]:
        c.setFillColor(Color(0, 0.79, 0.84, alpha))
        c.circle(cx_off, cy_off, radius, fill=1, stroke=0)
    # Orange accent circle
    c.setFillColor(Color(0.98, 0.45, 0.09, 0.03))
    c.circle(w * 0.1, h * 0.65, 150, fill=1, stroke=0)
    # Dot grid
    c.setFillColor(Color(1, 1, 1, 0.025))
    for gx in range(30, int(w), 35):
        for gy in range(30, int(h), 35):
            c.circle(gx, gy, 1, fill=1, stroke=0)
    # Top accent line
    c.setFillColor(CYAN)
    c.rect(0, h - 5, w, 5, fill=1, stroke=0)
    # "FREE GUIDE" badge
    c.setFillColor(ORANGE)
    c.roundRect(LM, h - 125, 110, 28, 14, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(LM + 55, h - 118, "FREE GUIDE")
    # Main title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 40)
    c.drawString(LM, h - 188, "The 2024")
    c.drawString(LM, h - 238, "Agency Scaling")
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 42)
    c.drawString(LM, h - 290, "Blueprint")
    # Subtitle
    c.setFillColor(Color(1, 1, 1, 0.65))
    c.setFont("Helvetica", 13)
    c.drawString(LM, h - 330, "How Top Travel Agencies Use Automation to")
    c.drawString(LM, h - 348, "Double Revenue & Reclaim 20 Hours a Week")
    # Cyan divider
    c.setStrokeColor(CYAN)
    c.setLineWidth(2.5)
    c.line(LM, h - 370, LM + 80, h - 370)
    # 3 stat blocks
    stats = [("70+", "Hours Saved", "Per Month"), ("45%", "Higher", "Conversions"), ("30%", "Revenue", "Increase")]
    for i, (num, l1, l2) in enumerate(stats):
        sx = LM + i * 155
        sy = h - 440
        c.setFillColor(CYAN)
        c.setFont("Helvetica-Bold", 34)
        c.drawString(sx, sy, num)
        c.setFillColor(Color(1, 1, 1, 0.5))
        c.setFont("Helvetica", 10)
        c.drawString(sx, sy - 18, l1)
        c.drawString(sx, sy - 32, l2)
    # Paper airplane illustration
    c.setFillColor(Color(0, 0.79, 0.84, 0.15))
    px, py = w - 120, h - 200
    p = c.beginPath()
    p.moveTo(px + 50, py)
    p.lineTo(px, py + 22)
    p.lineTo(px + 15, py)
    p.lineTo(px, py - 22)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setStrokeColor(Color(0, 0.79, 0.84, 0.08))
    c.setLineWidth(1)
    c.setDash(4, 5)
    trail = c.beginPath()
    trail.moveTo(px - 5, py)
    trail.curveTo(px - 40, py + 25, px - 65, py - 15, px - 90, py + 10)
    c.drawPath(trail, fill=0, stroke=1)
    # Bottom branding
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(LM, 80, "TravelSuite")
    c.setFillColor(Color(1, 1, 1, 0.4))
    c.setFont("Helvetica", 9.5)
    c.drawString(LM, 62, "The Operating System for Modern Travel Agencies")
    # Bottom accent
    c.setFillColor(CYAN)
    c.rect(0, 0, w, 4, fill=1, stroke=0)
    c.restoreState()


def draw_normal(c, doc):
    w, h = A4
    c.saveState()
    # Header line
    c.setStrokeColor(Color(CYAN_DARK.red, CYAN_DARK.green, CYAN_DARK.blue, 0.3))
    c.setLineWidth(1)
    c.line(LM, h - 32, w - RM, h - 32)
    # Branding
    c.setFillColor(CYAN_DARK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(LM, h - 26, "TravelSuite")
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawRightString(w - RM, h - 26, "The 2024 Agency Scaling Blueprint")
    # Footer
    c.setStrokeColor(SLATE_200)
    c.setLineWidth(0.5)
    c.line(LM, 38, w - RM, 38)
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(LM, 24, "travelsuite.in")
    page_num = doc.page if hasattr(doc, 'page') else ""
    c.drawCentredString(w / 2, 24, f"{page_num}")
    c.drawRightString(w - RM, 24, "Confidential - For Recipient Only")
    c.restoreState()


def draw_cta(c, doc):
    w, h = A4
    c.saveState()
    c.setFillColor(DARK_BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    # Decorative circles
    c.setFillColor(Color(0, 0.79, 0.84, 0.05))
    c.circle(w / 2, h * 0.6, 280, fill=1, stroke=0)
    c.setFillColor(Color(0.98, 0.45, 0.09, 0.03))
    c.circle(w * 0.15, h * 0.3, 160, fill=1, stroke=0)
    # Accents
    c.setFillColor(CYAN)
    c.rect(0, h - 4, w, 4, fill=1, stroke=0)
    c.rect(0, 0, w, 3, fill=1, stroke=0)
    c.restoreState()


# ═══════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════

def chapter_title(num, title, styles):
    """Return elements for a chapter heading."""
    elements = [Spacer(1, 8)]
    elements.append(Paragraph(f"CHAPTER {num:02d}", styles["chapter_label"]))
    # Small cyan line
    elements.append(SectionDivider(80, color=CYAN_DARK))
    elements.append(Paragraph(title, styles["h1"]))
    elements.append(Spacer(1, 4))
    return elements


def styled_table(data, col_widths, header_color=CYAN_DARK):
    """Create a consistently styled table."""
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_BODY),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, SLATE_200),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SLATE_50]),
    ]))
    return t


# ═══════════════════════════════════════════════
# DOCUMENT CONTENT
# ═══════════════════════════════════════════════

def build():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    normal_frame = Frame(LM, 52, CW, H - 100, id="normal", showBoundary=0)
    cover_frame = Frame(LM, 52, CW, 10, id="cover", showBoundary=0)
    cta_frame = Frame(LM, 52, CW, H - 100, id="cta", showBoundary=0)

    doc = BaseDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        leftMargin=LM, rightMargin=RM, topMargin=52, bottomMargin=52,
        title="The 2024 Agency Scaling Blueprint",
        author="TravelSuite",
        subject="How Top Travel Agencies Use Automation to Scale",
        creator="TravelSuite - travelsuite.in",
    )
    doc.addPageTemplates([
        PageTemplate("Cover", frames=[cover_frame], onPage=draw_cover),
        PageTemplate("Normal", frames=[normal_frame], onPage=draw_normal),
        PageTemplate("CTA", frames=[cta_frame], onPage=draw_cta),
    ])

    s = S()
    story = []

    # ────────────────────────────────────────────
    # COVER (page 1)
    # ────────────────────────────────────────────
    story.append(NextPageTemplate("Normal"))
    story.append(PageBreak())

    # ────────────────────────────────────────────
    # TABLE OF CONTENTS (page 2)
    # ────────────────────────────────────────────
    story.append(Spacer(1, 15))
    story.append(Paragraph("What's Inside", s["h1"]))
    story.append(SectionDivider(CW, color=CYAN_DARK))
    story.append(Spacer(1, 12))

    toc = [
        ("01", "The 50 Lakh Problem", "Calculating the real cost of manual workflows in your agency"),
        ("02", "5 Pillars of a Scalable Agency", "The proven framework used by top-performing operators"),
        ("03", "The Proposal Revolution", "Why interactive proposals convert 45% better than PDFs"),
        ("04", "WhatsApp Automation Playbook", "7 message templates that run your follow-ups on autopilot"),
        ("05", "The Add-On Revenue Machine", "Earn 3L+ more per month without acquiring new clients"),
        ("06", "Your 90-Day Scaling Roadmap", "A week-by-week action plan with measurable milestones"),
        ("07", "Choosing the Right Technology", "Feature checklist for evaluating travel agency tools"),
    ]
    for num, title, desc in toc:
        row = Table(
            [[Paragraph(num, s["toc_num"]),
              Paragraph(f'{title}<br/><font size="9" color="#{TEXT_MUTED.hexval()[2:]}">{desc}</font>', s["toc_title"])]],
            colWidths=[42, CW - 52]
        )
        row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, SLATE_100),
        ]))
        story.append(row)

    story.append(Spacer(1, 25))
    story.append(GlobeIllustration(55, CYAN_DARK))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        '<i>"The agencies that will thrive in 2025 are the ones automating today. '
        'This blueprint is your competitive advantage."</i>', s["quote"]
    ))
    story.append(Paragraph(
        '<b>- The TravelSuite Team</b>',
        ParagraphStyle("attr", fontName="Helvetica-Bold", fontSize=9, textColor=CYAN_DARK, alignment=TA_CENTER)
    ))
    story.append(Spacer(1, 10))
    story.append(CalloutBox(
        "WHO THIS IS FOR", "Solo tour operators, boutique agencies, and growing teams who want to "
        "stop drowning in manual work and start running a business that scales. Whether you handle "
        "10 trips or 100 trips a month, these frameworks apply to you.",
        CW, CYAN_DARK, CYAN_LIGHT
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────
    # CHAPTER 1: The 50 Lakh Problem
    # ────────────────────────────────────────────
    story.extend(chapter_title(1, "The 50 Lakh Problem", s))

    # Illustration + intro side by side
    intro_table = Table(
        [[RupeeIcon(50, ORANGE),
          Paragraph(
              "Every year, the average Indian travel agency bleeds <b>the equivalent of 50 lakh rupees</b> "
              "in lost productivity. Not through bad deals or market downturns - through invisible time "
              "drains hiding in everyday workflows that feel 'normal' but are anything but.", s["body"]
          )]],
        colWidths=[60, CW - 70]
    )
    intro_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (1, 0), (1, 0), 10)]))
    story.append(intro_table)

    story.append(Paragraph(
        "We surveyed 200+ tour operators across India and tracked how they spend their working hours. "
        "The results were eye-opening. Most operators spend <b>more than half their time on tasks that "
        "add zero value</b> to their clients - and they do not even realize it.", s["body"]
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Where Your Time Actually Goes", s["h2"]))

    time_data = [
        ["Activity", "Time Per Instance", "Monthly Total", "Annual Cost*"],
        ["Crafting proposals (Word/PDF)", "2 - 3 hours each", "40+ hours", "~4.8 Lakh"],
        ["WhatsApp follow-ups & reminders", "15 min per client", "20+ hours", "~2.4 Lakh"],
        ["Client tracking in Excel", "30 min daily upkeep", "10+ hours", "~1.2 Lakh"],
        ["Payment collection & chasing", "20 min per booking", "8+ hours", "~0.96 Lakh"],
        ["Driver & vendor coordination", "10 min per phone call", "12+ hours", "~1.44 Lakh"],
    ]
    story.append(styled_table(time_data, [160, 120, 95, 95]))
    story.append(Paragraph("<i>*Opportunity cost based on avg. operator earning potential of 6 LPA</i>", s["small"]))

    story.append(Spacer(1, 10))
    story.append(StatRow([
        ("90+", "Hours Wasted Monthly", RED),
        ("10.8L", "Annual Opportunity Cost", ORANGE),
        ("4.2x", "ROI of Automating", GREEN),
    ], CW, 78))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Calculate Your Own 'Manual Tax'", s["h2"]))
    story.append(Paragraph(
        "Every agency is different. Use this worksheet to estimate how much manual work is costing "
        "<b>your</b> business specifically. Be honest - the numbers might surprise you:", s["body"]
    ))

    calc_items = [
        "Proposals per month: ______ x 2.5 hrs = ______ hours",
        "Active clients: ______ x 30 min (follow-ups) = ______ hours",
        "Weekly Excel/tracking time: ______ hrs x 4 weeks = ______ hours",
        "Payment reminders per month: ______ x 20 min = ______ hours",
        "Vendor calls per week: ______ x 10 min x 4 = ______ hours",
    ]
    for item in calc_items:
        story.append(CheckItem(item, CW))

    story.append(Spacer(1, 8))
    story.append(CalloutBox(
        "YOUR TOTAL", "Add up all the hours above. Multiply by 12 for your annual 'manual tax'. "
        "If it exceeds 40 hours per month, there is a significant opportunity to reclaim time and "
        "reinvest it in actually growing your business - acquiring clients, building relationships, "
        "and exploring new destinations.",
        CW, GREEN, GREEN_LIGHT
    ))

    story.append(Spacer(1, 8))
    story.append(CalloutBox(
        "KEY INSIGHT", "The problem is not that you are working too few hours. Most operators we "
        "spoke with work 60-70 hour weeks. The problem is that 50-60% of those hours go to "
        "repetitive tasks that a system could handle in seconds. Freeing up even 20 hours a month "
        "means more time for client relationships, marketing, and enjoying the travel you sell.",
        CW, ORANGE, ORANGE_LIGHT, "!"
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────
    # CHAPTER 2: 5 Pillars
    # ────────────────────────────────────────────
    story.extend(chapter_title(2, "The 5 Pillars of a Scalable Travel Agency", s))

    story.append(Paragraph(
        "After studying hundreds of travel agencies across India - from solo operators in Jaipur to "
        "50-person teams in Mumbai - we identified five key pillars that separate agencies stuck at "
        "10-20 bookings a month from those consistently closing 100+.", s["body"]
    ))
    story.append(Paragraph(
        "These are not theoretical concepts. They are practical, actionable shifts that any agency "
        "can implement regardless of size or budget.", s["body"]
    ))

    story.append(Spacer(1, 6))

    pillars = [
        (1, "Interactive Proposals", CYAN_DARK,
         "The proposal is your most important sales asset. Static PDFs convert at just 18% on average "
         "because clients cannot interact with them - they cannot explore activities, customize dates, "
         "or see real-time pricing. Interactive web-based proposals let clients experience the trip "
         "before they book it.",
         "2-3 hours per Word/PDF proposal, no tracking, buried in email attachments",
         "5-minute proposals clients can explore on their phone, with read tracking and one-click booking. "
         "Agencies report conversion rates jumping from 18% to 34%"),

        (2, "Automated Client Communication", GREEN,
         "Indian travelers overwhelmingly prefer WhatsApp (87% vs 8% email). Yet most agencies send every "
         "message manually - booking confirmations, payment reminders, pre-trip checklists, driver details. "
         "That is 15+ messages per booking, all typed by hand.",
         "Manual WhatsApp messages, some clients fall through cracks, no message history",
         "Automated message flows triggered by booking events. Clients get consistent, timely "
         "communication while you focus on high-value conversations"),

        (3, "Smart CRM Pipeline", PURPLE,
         "You cannot scale what you cannot see. Excel sheets cannot tell you which leads are hot, which "
         "proposals need follow-up, or which clients are about to travel. A visual pipeline shows every "
         "client's journey at a glance - from new inquiry to repeat booking.",
         "Excel sheets, sticky notes, mental checklists, things inevitably slip through",
         "Visual pipeline boards with automatic status updates. Every team member sees "
         "the full picture - nothing falls through the cracks"),

        (4, "Revenue Optimization Through Add-Ons", ORANGE,
         "It costs 5-7x more to acquire a new client than to sell more to an existing one. The most "
         "profitable agencies maximize revenue per booking through curated add-on services like airport "
         "transfers, spa packages, and adventure activities.",
         "Occasional verbal upselling, no structured catalog, revenue left on table",
         "Curated add-on marketplace embedded in proposals. Clients browse and add extras with one click. "
         "Average revenue per booking increases by 30%"),

        (5, "Data-Driven Decision Making", BLUE,
         "How many proposals did you send last month? What is your conversion rate? Which destinations are "
         "most profitable? If you cannot answer instantly, you are making decisions based on gut feeling "
         "instead of data - and leaving money on the table.",
         "End-of-month guesswork, no real metrics, ad-hoc pricing decisions",
         "Real-time dashboards showing bookings, revenue, conversions, and team performance. "
         "Every decision backed by data, not intuition"),
    ]

    for num, title, color, body, old, new in pillars:
        story.append(PillarCard(num, title, body, old, new, color, CW))
        story.append(Spacer(1, 8))

    story.append(CalloutBox(
        "WHERE TO START", "Do not try to implement all five at once. Start with Pillar 1 "
        "(Interactive Proposals) - it has the highest immediate ROI and requires the least "
        "change to your existing workflow. Most agencies see measurable results within 2 weeks.",
        CW, CYAN_DARK, CYAN_LIGHT
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────
    # CHAPTER 3: The Proposal Revolution
    # ────────────────────────────────────────────
    story.extend(chapter_title(3, "The Proposal Revolution", s))

    intro_3 = Table(
        [[PlaneIllustration(70, 50, CYAN_DARK),
          Paragraph(
              "Your proposal is where a curious lead becomes a paying client - or where you lose them "
              "forever. Yet most agencies are still sending static PDF proposals that look like they "
              "were designed in 2010. Let us fix that.", s["body"]
          )]],
        colWidths=[80, CW - 90]
    )
    intro_3.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(intro_3)

    story.append(Paragraph("Why Static PDFs Are Hurting Your Business", s["h2"]))

    pdf_problems = [
        "<b>No engagement tracking</b> - You send it and pray. Did they open it? Did they read past page 1?",
        "<b>Buried in email</b> - 72% of Indian travelers primarily use mobile. PDFs on phones are painful.",
        "<b>Zero interactivity</b> - Clients cannot explore, customize, filter, or book. It is read-only.",
        "<b>Time-consuming to create</b> - 2-3 hours per proposal means fewer proposals, fewer bookings.",
        "<b>Instantly outdated</b> - Hotel prices change, flights sell out. Your PDF does not update itself.",
        "<b>No differentiation</b> - Every agency sends the same-looking PDF. You blend in instead of standing out.",
    ]
    for item in pdf_problems:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", s["bullet"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Case Study: Go Buddy Adventures, Hyderabad", s["h2"]))
    story.append(CalloutBox(
        "REAL RESULTS", "Go Buddy Adventures specializes in trekking and snow expeditions. After "
        "switching from PDF to interactive proposals: conversion rate jumped from 18% to 34% (an 89% "
        "improvement), time per proposal dropped from 2.5 hours to under 5 minutes, and overall "
        "quarterly bookings increased by 45%. The key was not just the technology - it was letting "
        "clients explore the adventure before committing.",
        CW, GREEN, GREEN_LIGHT
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("The 5-Minute Proposal Framework", s["h2"]))
    story.append(Paragraph(
        "Whether you use a tool or build your own system, here is the framework that top agencies follow "
        "to create proposals that actually convert:", s["body"]
    ))

    framework_steps = [
        ("Start With a Template", "Create reusable templates for your top 5 destinations. Include "
         "standard itineraries, popular hotels, and common activities. You should never start from a blank page."),
        ("Personalize in 2 Minutes", "Adjust dates, swap hotels based on budget, add or remove "
         "activities. The template handles 80% - you just customize the remaining 20%."),
        ("Embed Visual Proof", "Include high-quality photos of hotels, activities, and destinations. "
         "Add 1-2 short client testimonials relevant to the trip type. People buy with their eyes."),
        ("Add Smart Extras", "Include 3-5 curated add-ons relevant to the destination. Airport "
         "transfer, travel insurance, and one experience add-on cover most cases."),
        ("Make It Easy to Say Yes", "Include clear pricing, simple payment options (UPI, cards, EMI), "
         "and a prominent booking button. Remove every possible friction point."),
    ]
    for i, (title, desc) in enumerate(framework_steps, 1):
        story.append(NumberCircleStep(i, title, desc, CW, CYAN_DARK))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 8))
    story.append(Paragraph("The Perfect Proposal Checklist", s["h2"]))

    checklist = [
        "Stunning hero image that captures the destination's essence",
        "Day-by-day itinerary with activities, timings, and travel logistics",
        "Transparent pricing with clear breakdown (no hidden costs)",
        "High-quality photos for each hotel and key activity",
        "3-5 relevant add-on options with pricing",
        "2-3 social proof elements (testimonials, review scores, booking count)",
        "Multiple payment options clearly listed (UPI, card, EMI, bank transfer)",
        "Mobile-responsive design (72% of clients view on phone first)",
        "Clear call-to-action button (not just 'contact us' - make it specific)",
        "Your agency branding, WhatsApp number, and support contact",
    ]
    for item in checklist:
        story.append(CheckItem(item, CW))

    story.append(Spacer(1, 8))
    story.append(CalloutBox(
        "PRO TIP", "The highest-converting proposals include a 'Why Book With Us' section right "
        "before the pricing. List 3 unique reasons - your expertise with that destination, a relevant "
        "testimonial, and a specific guarantee (like 24/7 on-trip support). This alone can boost "
        "conversions by 10-15%.",
        CW, ORANGE, ORANGE_LIGHT
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph(
        '<font color="#64748B" size="9"><i>Tip: Tools like TravelSuite let you create interactive, '
        'trackable proposals in under 5 minutes with built-in templates for popular Indian and '
        'international destinations. But the framework above works regardless of your tools.</i></font>',
        s["center"]
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────
    # CHAPTER 4: WhatsApp Automation
    # ────────────────────────────────────────────
    story.extend(chapter_title(4, "WhatsApp Automation Playbook", s))

    wa_intro = Table(
        [[WhatsAppIcon(45, GREEN),
          Paragraph(
              "With 500+ million users in India and a 98% message open rate, WhatsApp is not optional "
              "for your travel business - it is essential. But there is a huge difference between using "
              "WhatsApp <i>manually</i> and using it <i>strategically</i>.", s["body"]
          )]],
        colWidths=[55, CW - 65]
    )
    wa_intro.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(wa_intro)

    story.append(Paragraph("The Channel Comparison", s["h2"]))
    channel_data = [
        ["Channel", "Open Rate", "Response Time", "Client Preference", "Automatable"],
        ["WhatsApp", "98%", "Under 2 min", "87% prefer", "Yes"],
        ["Email", "20%", "6+ hours", "8% prefer", "Yes"],
        ["Phone Call", "N/A", "Immediate", "5% prefer", "No"],
        ["SMS", "85%", "Under 5 min", "< 1%", "Limited"],
    ]
    story.append(styled_table(channel_data, [90, 75, 90, 105, 90], GREEN))

    story.append(Spacer(1, 12))
    story.append(Paragraph("The 7 Messages That Run Your Business on Autopilot", s["h2"]))
    story.append(Paragraph(
        "These are the exact message templates top-performing agencies use. Copy them, customize them "
        "for your brand voice, and set them up as automated flows:", s["body"]
    ))

    story.append(Spacer(1, 6))

    messages = [
        ("Booking Confirmation", "Immediately after booking",
         "Hi [Name]! Your [Destination] trip is confirmed! Booking ID: [ID]. "
         "Dates: [Start] to [End] for [Guests] guests. View your full itinerary here: [Link]. "
         "Questions? Just reply to this message!"),
        ("Payment Reminder", "3 days before due date",
         "Hi [Name], friendly reminder: your payment of [Amount] for the [Destination] trip is due "
         "on [Date]. Quick pay link: [Payment Link]. Need EMI options? Just ask!"),
        ("Pre-Trip Checklist", "5 days before departure",
         "Hi [Name]! Just 5 days to go until [Destination]! Quick checklist: Passport/ID valid? "
         "Forex/cards ready? Insurance active? Bags packed? Full itinerary + packing tips: [Link]"),
        ("Driver Details", "Morning of pickup",
         "Hi [Name], your driver [Driver Name] will be at [Location] at [Time]. "
         "Vehicle: [Details]. Driver contact: [Phone]. Safe travels!"),
        ("Daily Activity Update", "Each morning during trip",
         "Good morning from [Destination]! Today: [Activity 1] at [Time], [Activity 2] at [Time]. "
         "Weather: [Forecast]. Insider tip: [Local recommendation]. Have an amazing day!"),
        ("Post-Trip Review Request", "2 days after return",
         "Hi [Name]! Hope [Destination] was incredible! We would love your feedback - it takes 2 min: "
         "[Review Link]. As a thank you: 10% off your next trip with code [CODE]."),
        ("Re-Engagement", "90 days after last trip",
         "Hi [Name]! It has been a while since your amazing [Destination] trip. We have curated new "
         "experiences you might love: [Link]. Returning travelers get exclusive pricing until [Date]!"),
    ]

    for i, (title, trigger, tmpl) in enumerate(messages, 1):
        story.append(MessageTemplate(i, title, trigger, tmpl, CW))
        story.append(Spacer(1, 5))

    story.append(Spacer(1, 8))

    story.append(Paragraph("Time Saved With Automation", s["h2"]))
    roi_data = [
        ["Message Type", "Manual Time", "Automated", "Monthly Savings"],
        ["Booking confirmations", "10 min each", "Instant", "5+ hours"],
        ["Payment reminders", "15 min each", "Instant", "4+ hours"],
        ["Pre-trip checklists", "20 min each", "Instant", "3+ hours"],
        ["Driver coordination", "10 min/call", "Instant", "4+ hours"],
        ["Daily updates", "15 min each", "Instant", "6+ hours"],
        ["Review requests", "5 min each", "Instant", "1.5+ hours"],
        ["Re-engagement", "10 min each", "Instant", "2+ hours"],
    ]
    story.append(styled_table(roi_data, [140, 85, 80, 100], GREEN))

    story.append(Spacer(1, 8))
    story.append(StatRow([
        ("25+", "Hours Saved Monthly", GREEN),
        ("98%", "WhatsApp Open Rate", BLUE),
        ("0", "Messages Forgotten", CYAN_DARK),
    ], CW, 72))

    story.append(Spacer(1, 8))
    story.append(CalloutBox(
        "START SMALL", "You do not need all 7 messages on day one. Start with just the booking "
        "confirmation and payment reminder. These two alone save 9+ hours monthly and dramatically "
        "improve client experience. Add one new message each week.",
        CW, ORANGE, ORANGE_LIGHT
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph(
        '<font color="#64748B" size="9"><i>You can set these up manually using WhatsApp Business features, '
        'or use a platform like TravelSuite that triggers them automatically based on booking events.</i></font>',
        s["center"]
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────
    # CHAPTER 5: Add-On Revenue Machine
    # ────────────────────────────────────────────
    story.extend(chapter_title(5, "The Add-On Revenue Machine", s))

    rev_intro = Table(
        [[ChartIllustration(100, 60, GREEN),
          Paragraph(
              "Here is the single most important growth insight in this entire guide: <b>you do not need "
              "more clients to grow revenue</b>. The most profitable agencies earn 30% or more of their "
              "revenue from add-on services sold to existing bookings. That is pure incremental profit.",
              s["body"]
          )]],
        colWidths=[110, CW - 120]
    )
    rev_intro.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(rev_intro)

    story.append(Spacer(1, 6))
    story.append(StatRow([
        ("+30%", "Revenue Per Booking", ORANGE),
        ("72%", "Clients Want Extras", GREEN),
        ("5-7x", "Cheaper Than New Client", BLUE),
    ], CW, 78))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Top 10 High-Margin Add-Ons for Indian Tour Operators", s["h2"]))

    addon_header = Table(
        [["#", "Add-On Service", "Typical Price (INR)", "Margin", "Demand"]],
        colWidths=[25, 180, 120, 75, CW - 400]
    )
    addon_header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(addon_header)

    addons = [
        ("1", "Airport Transfers (Private)", "1,500 - 4,000", "40-50%", "Very High"),
        ("2", "Travel Insurance", "800 - 2,500", "60-70%", "High"),
        ("3", "Adventure Activities", "2,000 - 8,000", "25-35%", "High"),
        ("4", "Spa & Wellness Packages", "3,000 - 10,000", "35-45%", "Medium-High"),
        ("5", "Candlelight Dinner Setup", "4,000 - 12,000", "40-55%", "Medium"),
        ("6", "Photography Packages", "5,000 - 15,000", "50-60%", "Growing"),
        ("7", "Visa Assistance", "2,000 - 5,000", "70-80%", "High"),
        ("8", "Local SIM / WiFi Hotspot", "500 - 1,500", "50-60%", "High"),
        ("9", "Room or Flight Upgrades", "3,000 - 20,000", "20-30%", "Medium"),
        ("10", "Cultural Experiences", "1,500 - 6,000", "30-40%", "Growing"),
    ]
    for a in addons:
        story.append(AddonRow(*a, width=CW))

    story.append(Spacer(1, 12))
    story.append(Paragraph("The One-Click Upsell Strategy", s["h2"]))
    story.append(Paragraph(
        "The secret is not <i>what</i> you sell - it is <i>how</i> you sell it. When clients have to "
        "call you, wait for a quote, and transfer money separately, the drop-off is enormous. But when "
        "they can browse and add extras with one click while viewing their itinerary, uptake rates "
        "skyrocket. Here is the framework:", s["body"]
    ))

    upsell_steps = [
        ("Show at the Right Moment", "Present add-ons when excitement is highest - right after "
         "the client views their itinerary, not in a separate follow-up message days later."),
        ("Curate by Destination", "Show only relevant options. A Bali proposal shows temple tours "
         "and surf lessons, not ski packages. Relevance drives conversion."),
        ("Price with Transparency", "Show exact prices with what is included. Never use 'call for pricing' "
         "- that kills momentum. Include a photo and brief description."),
        ("Remove All Friction", "One click to add. No separate invoices, no phone calls, no bank "
         "transfers. The add-on amount is added directly to the booking total."),
    ]
    for i, (title, desc) in enumerate(upsell_steps, 1):
        story.append(NumberCircleStep(i, title, desc, CW, ORANGE))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 10))
    story.append(CalloutBox(
        "REVENUE MATH", "If you handle 30 bookings/month at avg. 50,000 each: Current revenue "
        "= 15,00,000/month. With 30% add-on uplift = 19,50,000/month. That is 4,50,000 extra per "
        "month or 54 lakh per year - without a single new client. Even a 15% uplift adds 27 lakh annually.",
        CW, GREEN, GREEN_LIGHT
    ))

    story.append(Spacer(1, 6))
    story.append(CalloutBox(
        "START WITH THREE", "You do not need all 10 add-ons on day one. Start with: (1) Airport "
        "transfers - near-universal demand, (2) Travel insurance - high margin, easy to explain, "
        "(3) One experience add-on relevant to your top destination. These three cover 70% of "
        "potential upsell revenue.",
        CW, ORANGE, ORANGE_LIGHT
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────
    # CHAPTER 6: 90-Day Roadmap
    # ────────────────────────────────────────────
    story.extend(chapter_title(6, "Your 90-Day Scaling Roadmap", s))

    story.append(Paragraph(
        "Theory without execution is just entertainment. Here is the exact 90-day roadmap that has "
        "helped agencies across India transform their operations. Follow it week by week, and you will "
        "see measurable results within the first 30 days.", s["body"]
    ))

    story.append(RoadmapIllustration(CW, 55))
    story.append(Spacer(1, 8))

    # Month 1
    story.append(Paragraph('<font color="#0097A7"><b>MONTH 1: FOUNDATION</b></font>', s["h2"]))
    story.append(Paragraph(
        "This month is about getting your house in order. Do not rush into automation until your "
        "foundation is solid - a shaky base means rework later.", s["body"]
    ))

    m1_data = [
        ["Week", "Focus", "Key Actions", "Success Metric"],
        ["1", "Audit", "Map current workflow, identify top 3 bottlenecks, "
         "set up digital workspace", "Bottlenecks documented"],
        ["2", "Proposals", "Create 5 destination templates, "
         "send first 10 interactive proposals", "10 proposals sent"],
        ["3", "CRM", "Define pipeline stages (Lead > Proposal > "
         "Negotiation > Booked > Completed), migrate data", "All leads in pipeline"],
        ["4", "Measure", "Track proposal open rates, conversion "
         "changes, time savings vs. week 1", "Baseline metrics set"],
    ]
    story.append(styled_table(m1_data, [40, 60, 250, 115], CYAN_DARK))

    story.append(Spacer(1, 10))
    # Month 2
    story.append(Paragraph('<font color="#F97316"><b>MONTH 2: AUTOMATION</b></font>', s["h2"]))
    story.append(Paragraph(
        "With your foundation in place, it is time to start automating the repetitive tasks that "
        "eat your time. Start with the highest-impact, lowest-risk automations.", s["body"]
    ))

    m2_data = [
        ["Week", "Focus", "Key Actions", "Success Metric"],
        ["5", "WhatsApp", "Set up booking confirmation and payment "
         "reminder automations, create message templates", "2 flows live"],
        ["6", "Payments", "Connect payment gateway (Razorpay/Stripe), "
         "add payment links to proposals, enable UPI", "50%+ online payments"],
        ["7", "Operations", "Set up driver database, auto-assignments, "
         "client-facing driver detail messages", "Zero manual driver calls"],
        ["8", "Review", "Audit all automations, fix edge cases, "
         "add pre-trip and post-trip message flows", "5+ automations live"],
    ]
    story.append(styled_table(m2_data, [40, 60, 250, 115], ORANGE))

    story.append(Spacer(1, 10))
    # Month 3
    story.append(Paragraph('<font color="#059669"><b>MONTH 3: GROWTH</b></font>', s["h2"]))
    story.append(Paragraph(
        "Your systems are running. Now it is time to scale - more revenue per booking, better data, "
        "and a team that can operate independently.", s["body"]
    ))

    m3_data = [
        ["Week", "Focus", "Key Actions", "Success Metric"],
        ["9", "Add-Ons", "Curate top 3-5 add-ons per destination, "
         "embed in all proposal templates with pricing", "Add-ons in 100% of proposals"],
        ["10", "Analytics", "Set up revenue dashboard, track "
         "team performance, review add-on uptake rates", "Weekly reports running"],
        ["11", "Team", "Onboard team on new workflows, "
         "document SOPs, delegate proposal creation", "Team handles 50%+ proposals"],
        ["12", "Optimize", "A/B test proposal layouts, optimize "
         "WhatsApp timing, set Q2 growth targets", "30%+ improvement in key KPIs"],
    ]
    story.append(styled_table(m3_data, [40, 60, 250, 115], GREEN))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Key Performance Indicators to Track", s["h2"]))

    kpis = [
        "<b>Proposal Conversion Rate</b> - Target: 30%+ (up from industry average of 18%)",
        "<b>Average Booking Value</b> - Target: 20-30% increase via add-ons",
        "<b>Time Per Proposal</b> - Target: Under 10 minutes (down from 2+ hours)",
        "<b>Client Response Time</b> - Target: Under 2 hours (via WhatsApp automation)",
        "<b>Revenue Per Team Member</b> - Target: 2x improvement by end of Month 3",
        "<b>Repeat Client Rate</b> - Target: 25%+ (via post-trip re-engagement)",
    ]
    for kpi in kpis:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {kpi}", s["bullet"]))

    story.append(Spacer(1, 8))
    story.append(CalloutBox(
        "PATIENCE PAYS", "Do not skip ahead. Agencies that rush through Month 1 often restart "
        "because their foundation is shaky. A solid client database and proposal system are "
        "prerequisites for automation. Build the foundation first, automate second, scale third.",
        CW, CYAN_DARK, CYAN_LIGHT
    ))

    story.append(PageBreak())

    # ────────────────────────────────────────────
    # CHAPTER 7: Technology Stack
    # ────────────────────────────────────────────
    story.extend(chapter_title(7, "Choosing the Right Technology", s))

    story.append(Paragraph(
        "The right technology accelerates everything in this guide. The wrong technology adds "
        "complexity without solving problems. Here is how to evaluate your options, whether you "
        "choose TravelSuite or build your own stack.", s["body"]
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("The Must-Have Feature Checklist", s["h2"]))
    story.append(Paragraph(
        "Use this checklist to evaluate any tool or platform. A good travel agency OS should "
        "check <b>at least 8 of these 12 boxes</b>:", s["body"]
    ))

    features = [
        ("Interactive, web-based proposals", "Not just PDF generation - clients should be able to explore, customize, and book"),
        ("WhatsApp integration", "Native WhatsApp messaging with automation, not just a chat widget"),
        ("Travel-specific CRM", "Pipeline stages designed for travel (Lead > Proposal > Booked > Completed), not generic sales"),
        ("Add-on marketplace", "Ability to embed curated extras in proposals with one-click purchase"),
        ("Flight & hotel search", "Real-time search integrated into proposal creation (GDS/Amadeus ideal)"),
        ("Driver/vendor management", "Database, auto-assignment, client-facing details - not just a contact list"),
        ("Payment collection", "Built-in payment links with UPI, cards, and EMI support for Indian market"),
        ("Client-facing itinerary", "Interactive, mobile-responsive trip page - not a downloadable PDF"),
        ("Analytics dashboard", "Revenue, conversions, team performance - travel-specific metrics"),
        ("Mobile-first design", "Works beautifully on phone for both you and your clients"),
        ("India-specific features", "INR, UPI, GST, Indian bank integrations, Hindi support"),
        ("Team collaboration", "Multi-user access with roles, shared pipeline, activity logs"),
    ]

    for title, desc in features:
        story.append(CheckItem(f"{title}", CW, checked=True))
        story.append(Paragraph(
            f'<font color="#{TEXT_MUTED.hexval()[2:]}" size="8.5">   {desc}</font>',
            ParagraphStyle("feat_desc", fontName="Helvetica", fontSize=8.5, leading=12,
                           textColor=TEXT_MUTED, leftIndent=22, spaceAfter=4)
        ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Comparison: Your Options", s["h2"]))

    comp_data = [
        ["Capability", "Generic CRM\n(Zoho, HubSpot)", "Cobbled Tools\n(Excel+WhatsApp)", "Travel Agency OS"],
        ["Interactive proposals", "No", "No", "Yes, built-in"],
        ["WhatsApp automation", "Limited add-on", "Manual only", "Native integration"],
        ["Travel CRM pipeline", "Generic stages", "No pipeline", "Travel-specific"],
        ["Add-on marketplace", "Not available", "Not available", "Built-in"],
        ["GDS integration", "Not available", "Manual search", "Amadeus integrated"],
        ["Payment (UPI/INR)", "Separate setup", "Manual", "One-click setup"],
        ["Setup time", "2-4 weeks", "N/A", "Under 1 hour"],
        ["Monthly cost", "3,000 - 15,000+", "Free (but costly in time)", "999 - 2,499"],
    ]
    comp_table = Table(comp_data, colWidths=[115, 115, 115, 115])
    comp_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SLATE_700),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_BODY),
        ("TEXTCOLOR", (1, 1), (1, -1), RED),
        ("TEXTCOLOR", (2, 1), (2, -1), RED),
        ("TEXTCOLOR", (3, 1), (3, -1), GREEN),
        ("FONTNAME", (3, 1), (3, -1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, SLATE_200),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SLATE_50]),
    ]))
    story.append(comp_table)

    story.append(Spacer(1, 10))
    story.append(Paragraph("What Real Operators Are Saying", s["h2"]))

    testimonials = [
        ("Priya Sharma, WanderLust Tours - Mumbai",
         "We went from 15 bookings to 38 in 90 days. The interactive proposals changed everything - "
         "clients love exploring trips on their phones."),
        ("Rajesh Kumar, Incredible India Tours - Delhi",
         "I used to spend every Sunday making proposals. Now I create 5 before my morning chai. "
         "The WhatsApp automation saved us 20 hours a month."),
        ("Meena Patel, Spice Route Travels - Ahmedabad",
         "The add-on marketplace generated 2.8 lakh in extra revenue in month one. Our clients "
         "were already wanting these services - we just made it easy."),
    ]
    for name, quote in testimonials:
        story.append(Paragraph(f'<i>"{quote}"</i>', ParagraphStyle(
            "tq", fontName="Helvetica-Oblique", fontSize=9.5, leading=14,
            textColor=TEXT_BODY, leftIndent=12, rightIndent=12, spaceAfter=2
        )))
        story.append(Paragraph(f'- {name}', ParagraphStyle(
            "ta", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
            textColor=CYAN_DARK, leftIndent=12, spaceAfter=10
        )))

    story.append(CalloutBox(
        "HONEST ADVICE", "No tool will fix a broken business model. Technology amplifies what "
        "is already working. Before investing in any platform, make sure you have a clear value "
        "proposition, a defined target market, and a service your clients genuinely love. The "
        "frameworks in this guide work with or without technology - tools just make them faster.",
        CW, PURPLE, PURPLE_LIGHT
    ))

    story.append(NextPageTemplate("CTA"))
    story.append(PageBreak())

    # ────────────────────────────────────────────
    # FINAL CTA PAGE
    # ────────────────────────────────────────────
    story.append(Spacer(1, 70))

    story.append(Paragraph("Ready to Put This<br/>Blueprint Into Action?", ParagraphStyle(
        "cta_h", fontName="Helvetica-Bold", fontSize=30, leading=38,
        textColor=white, alignment=TA_CENTER, spaceAfter=12
    )))

    story.append(SectionDivider(80, color=CYAN))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "You have the frameworks, the templates, and the roadmap.<br/>"
        "The only question left is: when do you start?",
        ParagraphStyle("cta_sub", fontName="Helvetica", fontSize=13, leading=20,
                       textColor=Color(1, 1, 1, 0.6), alignment=TA_CENTER, spaceAfter=25)
    ))

    story.append(Paragraph("Start Your Free 14-Day Trial", ParagraphStyle(
        "cta_trial", fontName="Helvetica-Bold", fontSize=18, leading=24,
        textColor=CYAN, alignment=TA_CENTER, spaceAfter=4
    )))
    story.append(Paragraph("No credit card required  |  Set up in 5 minutes", ParagraphStyle(
        "cta_det", fontName="Helvetica", fontSize=10, leading=14,
        textColor=Color(1, 1, 1, 0.45), alignment=TA_CENTER, spaceAfter=15
    )))

    story.append(Paragraph("travelsuite.in", ParagraphStyle(
        "cta_url", fontName="Helvetica-Bold", fontSize=22, leading=28,
        textColor=ORANGE, alignment=TA_CENTER, spaceAfter=25
    )))

    features_cta = [
        "Unlimited interactive proposals",
        "WhatsApp automation engine",
        "Built-in travel CRM pipeline",
        "Add-on marketplace",
        "Amadeus flight & hotel search",
        "Payment collection (Razorpay + Stripe + UPI)",
    ]
    for feat in features_cta:
        story.append(Paragraph(
            f'<font color="#{CYAN.hexval()[2:]}">&#10003;</font>  {feat}',
            ParagraphStyle("cta_f", fontName="Helvetica", fontSize=11, leading=19,
                           textColor=Color(1, 1, 1, 0.75), alignment=TA_CENTER)
        ))

    story.append(Spacer(1, 25))
    story.append(Paragraph(
        "Join 500+ Indian tour operators already scaling with TravelSuite",
        ParagraphStyle("cta_social", fontName="Helvetica-Bold", fontSize=10, leading=14,
                       textColor=Color(1, 1, 1, 0.35), alignment=TA_CENTER, spaceAfter=20)
    ))

    story.append(Paragraph(
        "team@travelsuite.in  |  travelsuite.in",
        ParagraphStyle("cta_contact", fontName="Helvetica", fontSize=9, leading=14,
                       textColor=Color(1, 1, 1, 0.3), alignment=TA_CENTER)
    ))
    story.append(Paragraph(
        "Built by tour operators, for tour operators.",
        ParagraphStyle("cta_tagline", fontName="Helvetica-Oblique", fontSize=9, leading=14,
                       textColor=Color(1, 1, 1, 0.3), alignment=TA_CENTER)
    ))

    # ─── Build ───
    doc.build(story)
    print(f"Generated: {OUTPUT_PATH}")
    return OUTPUT_PATH


if __name__ == "__main__":
    path = build()
    print(f"File size: {os.path.getsize(path) / 1024:.1f} KB")
