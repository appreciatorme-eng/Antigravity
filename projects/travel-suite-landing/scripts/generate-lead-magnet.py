#!/usr/bin/env python3
"""Generate the TravelSuite Agency Scaling Blueprint lead magnet PDF."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem, KeepTogether, Flowable, HRFlowable,
    NextPageTemplate, PageTemplate, Frame
)
from reportlab.lib.pagesizes import A4 as _A4_SIZE
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line
from reportlab.graphics import renderPDF

# ─── Colors ───
CYAN = HexColor("#00F0FF")
CYAN_DARK = HexColor("#00B8C4")
CYAN_LIGHT = HexColor("#E0FCFF")
ORANGE = HexColor("#FF9933")
ORANGE_LIGHT = HexColor("#FFF3E0")
DARK_BG = HexColor("#0A0F1A")
DARK_CARD = HexColor("#111827")
DARK_CARD_LIGHT = HexColor("#1F2937")
MEDIUM_GRAY = HexColor("#6B7280")
LIGHT_GRAY = HexColor("#F3F4F6")
VERY_LIGHT_GRAY = HexColor("#F9FAFB")
TEXT_DARK = HexColor("#111827")
TEXT_MEDIUM = HexColor("#374151")
TEXT_LIGHT = HexColor("#6B7280")
PURPLE = HexColor("#A259FF")
GREEN = HexColor("#10B981")
RED_SOFT = HexColor("#EF4444")
BLUE_SOFT = HexColor("#3B82F6")

WIDTH, HEIGHT = A4
LEFT_MARGIN = 50
RIGHT_MARGIN = 50
CONTENT_WIDTH = WIDTH - LEFT_MARGIN - RIGHT_MARGIN

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "The-2024-Agency-Scaling-Blueprint.pdf")


# ─── Custom Flowables ───

class ColoredBox(Flowable):
    """A colored rectangle with text content inside."""
    def __init__(self, width, height, bg_color, content_lines, text_color=white,
                 border_color=None, border_radius=8, padding=15, font_size=10):
        super().__init__()
        self.box_width = width
        self.box_height = height
        self.bg_color = bg_color
        self.content_lines = content_lines
        self.text_color = text_color
        self.border_color = border_color
        self.border_radius = border_radius
        self.padding = padding
        self.font_size = font_size

    def wrap(self, availWidth, availHeight):
        return self.box_width, self.box_height

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(self.bg_color)
        if self.border_color:
            c.setStrokeColor(self.border_color)
            c.setLineWidth(1.5)
        else:
            c.setStrokeColor(self.bg_color)
        c.roundRect(0, 0, self.box_width, self.box_height,
                    self.border_radius, fill=1, stroke=1 if self.border_color else 0)
        c.setFillColor(self.text_color)
        c.setFont("Helvetica", self.font_size)
        y = self.box_height - self.padding - self.font_size
        for line in self.content_lines:
            if isinstance(line, tuple):
                font_name, size, color, text = line
                c.setFont(font_name, size)
                c.setFillColor(color)
                c.drawString(self.padding, y, text)
                y -= size + 6
            else:
                c.drawString(self.padding, y, line)
                y -= self.font_size + 5
        c.restoreState()


class StatCard(Flowable):
    """A stat highlight card with big number and label."""
    def __init__(self, width, height, number, label, accent_color=CYAN, bg_color=None):
        super().__init__()
        self.card_width = width
        self.card_height = height
        self.number = number
        self.label = label
        self.accent_color = accent_color
        self.bg_color = bg_color or VERY_LIGHT_GRAY

    def wrap(self, availWidth, availHeight):
        return self.card_width, self.card_height

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(self.bg_color)
        c.roundRect(0, 0, self.card_width, self.card_height, 8, fill=1, stroke=0)
        c.setFillColor(self.accent_color)
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(self.card_width / 2, self.card_height - 45, self.number)
        c.setFillColor(TEXT_MEDIUM)
        c.setFont("Helvetica", 10)
        c.drawCentredString(self.card_width / 2, self.card_height - 65, self.label)
        c.restoreState()


class DividerLine(Flowable):
    """A thin horizontal divider."""
    def __init__(self, width, color=CYAN, thickness=1.5):
        super().__init__()
        self.line_width = width
        self.color = color
        self.thickness = thickness

    def wrap(self, availWidth, availHeight):
        return self.line_width, self.thickness + 10

    def draw(self):
        self.canv.saveState()
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 5, self.line_width, 5)
        self.canv.restoreState()


class ChecklistItem(Flowable):
    """A styled checklist item with checkbox."""
    def __init__(self, text, width, checked=False):
        super().__init__()
        self.text = text
        self.item_width = width
        self.checked = checked

    def wrap(self, availWidth, availHeight):
        return self.item_width, 22

    def draw(self):
        c = self.canv
        c.saveState()
        c.setStrokeColor(CYAN_DARK)
        c.setLineWidth(1.2)
        c.rect(0, 6, 12, 12, fill=0, stroke=1)
        if self.checked:
            c.setStrokeColor(GREEN)
            c.setLineWidth(2)
            c.line(2, 11, 5, 8)
            c.line(5, 8, 10, 16)
        c.setFillColor(TEXT_DARK)
        c.setFont("Helvetica", 10)
        c.drawString(20, 8, self.text)
        c.restoreState()


class ProTipBox(Flowable):
    """A highlighted Pro Tip callout box."""
    def __init__(self, text, width):
        super().__init__()
        self.text = text
        self.box_width = width
        lines = self._wrap_text(text, width - 50)
        self.box_height = max(60, 30 + len(lines) * 15)

    def _wrap_text(self, text, max_width):
        words = text.split()
        lines = []
        current = ""
        for w in words:
            test = current + " " + w if current else w
            if len(test) * 5.5 < max_width:
                current = test
            else:
                lines.append(current)
                current = w
        if current:
            lines.append(current)
        return lines

    def wrap(self, availWidth, availHeight):
        return self.box_width, self.box_height + 10

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(HexColor("#FFF7ED"))
        c.setStrokeColor(ORANGE)
        c.setLineWidth(2)
        c.roundRect(0, 0, self.box_width, self.box_height, 6, fill=1, stroke=0)
        c.setFillColor(ORANGE)
        c.roundRect(0, 0, 4, self.box_height, 2, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(ORANGE)
        c.drawString(15, self.box_height - 18, "PRO TIP")
        c.setFont("Helvetica", 9.5)
        c.setFillColor(TEXT_MEDIUM)
        lines = self._wrap_text(self.text, self.box_width - 50)
        y = self.box_height - 35
        for line in lines:
            c.drawString(15, y, line)
            y -= 14
        c.restoreState()


class NumberedStep(Flowable):
    """A numbered step with circle and description."""
    def __init__(self, number, title, desc, width, accent=CYAN):
        super().__init__()
        self.number = str(number)
        self.title = title
        self.desc = desc
        self.step_width = width
        self.accent = accent
        desc_lines = self._wrap_text(desc, width - 60)
        self.step_height = max(50, 25 + len(desc_lines) * 14 + 10)

    def _wrap_text(self, text, max_width):
        words = text.split()
        lines = []
        current = ""
        for w in words:
            test = current + " " + w if current else w
            if len(test) * 5.2 < max_width:
                current = test
            else:
                lines.append(current)
                current = w
        if current:
            lines.append(current)
        return lines

    def wrap(self, availWidth, availHeight):
        return self.step_width, self.step_height

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(self.accent)
        c.circle(18, self.step_height - 18, 14, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(18, self.step_height - 23, self.number)
        c.setFillColor(TEXT_DARK)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(42, self.step_height - 22, self.title)
        c.setFillColor(TEXT_MEDIUM)
        c.setFont("Helvetica", 9.5)
        lines = self._wrap_text(self.desc, self.step_width - 60)
        y = self.step_height - 40
        for line in lines:
            c.drawString(42, y, line)
            y -= 14
        c.restoreState()


# ─── Styles ───

def get_styles():
    return {
        "title": ParagraphStyle(
            "Title", fontName="Helvetica-Bold", fontSize=28,
            leading=34, textColor=TEXT_DARK, alignment=TA_LEFT,
            spaceAfter=6
        ),
        "subtitle": ParagraphStyle(
            "Subtitle", fontName="Helvetica", fontSize=14,
            leading=20, textColor=TEXT_MEDIUM, alignment=TA_LEFT,
            spaceAfter=20
        ),
        "h1": ParagraphStyle(
            "H1", fontName="Helvetica-Bold", fontSize=22,
            leading=28, textColor=TEXT_DARK, alignment=TA_LEFT,
            spaceBefore=10, spaceAfter=10
        ),
        "h2": ParagraphStyle(
            "H2", fontName="Helvetica-Bold", fontSize=16,
            leading=22, textColor=TEXT_DARK, alignment=TA_LEFT,
            spaceBefore=14, spaceAfter=6
        ),
        "h3": ParagraphStyle(
            "H3", fontName="Helvetica-Bold", fontSize=13,
            leading=18, textColor=TEXT_DARK, alignment=TA_LEFT,
            spaceBefore=10, spaceAfter=4
        ),
        "body": ParagraphStyle(
            "Body", fontName="Helvetica", fontSize=10.5,
            leading=16, textColor=TEXT_MEDIUM, alignment=TA_JUSTIFY,
            spaceAfter=8
        ),
        "body_bold": ParagraphStyle(
            "BodyBold", fontName="Helvetica-Bold", fontSize=10.5,
            leading=16, textColor=TEXT_DARK, alignment=TA_LEFT,
            spaceAfter=6
        ),
        "small": ParagraphStyle(
            "Small", fontName="Helvetica", fontSize=9,
            leading=13, textColor=TEXT_LIGHT, alignment=TA_LEFT,
            spaceAfter=4
        ),
        "bullet": ParagraphStyle(
            "Bullet", fontName="Helvetica", fontSize=10.5,
            leading=16, textColor=TEXT_MEDIUM, alignment=TA_LEFT,
            leftIndent=20, spaceAfter=4, bulletIndent=8,
            bulletFontName="Helvetica", bulletFontSize=10.5
        ),
        "center": ParagraphStyle(
            "Center", fontName="Helvetica", fontSize=11,
            leading=16, textColor=TEXT_MEDIUM, alignment=TA_CENTER,
            spaceAfter=8
        ),
        "center_bold": ParagraphStyle(
            "CenterBold", fontName="Helvetica-Bold", fontSize=14,
            leading=20, textColor=TEXT_DARK, alignment=TA_CENTER,
            spaceAfter=8
        ),
        "toc_item": ParagraphStyle(
            "TOCItem", fontName="Helvetica", fontSize=12,
            leading=22, textColor=TEXT_DARK, alignment=TA_LEFT,
            leftIndent=10, spaceAfter=2
        ),
        "toc_chapter": ParagraphStyle(
            "TOCChapter", fontName="Helvetica-Bold", fontSize=12,
            leading=24, textColor=CYAN_DARK, alignment=TA_LEFT,
            spaceAfter=2
        ),
        "quote": ParagraphStyle(
            "Quote", fontName="Helvetica-Oblique", fontSize=12,
            leading=18, textColor=CYAN_DARK, alignment=TA_CENTER,
            spaceBefore=10, spaceAfter=10, leftIndent=30, rightIndent=30
        ),
        "footer": ParagraphStyle(
            "Footer", fontName="Helvetica", fontSize=8,
            leading=10, textColor=TEXT_LIGHT, alignment=TA_CENTER
        ),
    }


# ─── Page Templates ───

def cover_page(canvas_obj, doc):
    """Draw the cover page with dark background and branding."""
    c = canvas_obj
    w, h = A4
    c.saveState()

    # Dark gradient background
    c.setFillColor(DARK_BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Decorative top accent bar
    c.setFillColor(CYAN)
    c.rect(0, h - 8, w, 8, fill=1, stroke=0)

    # Decorative geometric shapes
    c.setFillColor(Color(0, 0.94, 1, 0.08))
    c.circle(w - 80, h - 120, 180, fill=1, stroke=0)
    c.setFillColor(Color(1, 0.6, 0.2, 0.06))
    c.circle(60, 200, 140, fill=1, stroke=0)
    c.setFillColor(Color(0.64, 0.35, 1, 0.05))
    c.circle(w / 2, h / 2 + 50, 100, fill=1, stroke=0)

    # Subtle grid pattern
    c.setStrokeColor(Color(1, 1, 1, 0.03))
    c.setLineWidth(0.5)
    for x_pos in range(0, int(w), 40):
        c.line(x_pos, 0, x_pos, h)
    for y_pos in range(0, int(h), 40):
        c.line(0, y_pos, w, y_pos)

    # FREE GUIDE badge
    badge_w, badge_h = 120, 30
    badge_x = 50
    badge_y = h - 130
    c.setFillColor(ORANGE)
    c.roundRect(badge_x, badge_y, badge_w, badge_h, 4, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(badge_x + badge_w / 2, badge_y + 9, "FREE GUIDE")

    # Main title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 38)
    title_y = h - 200
    c.drawString(50, title_y, "The 2024")
    c.drawString(50, title_y - 48, "Agency Scaling")
    c.setFillColor(CYAN)
    c.drawString(50, title_y - 96, "Blueprint")

    # Subtitle
    c.setFillColor(Color(1, 1, 1, 0.7))
    c.setFont("Helvetica", 14)
    c.drawString(50, title_y - 145, "How Top Travel Agencies Use Automation")
    c.drawString(50, title_y - 165, "to Double Revenue & Reclaim 20 Hours a Week")

    # Divider line
    c.setStrokeColor(CYAN)
    c.setLineWidth(2)
    c.line(50, title_y - 190, 250, title_y - 190)

    # Key stats
    stats = [
        ("70+", "Hours Saved\nPer Month"),
        ("45%", "Higher\nConversions"),
        ("30%", "Revenue\nIncrease"),
    ]
    stat_y = title_y - 260
    stat_x = 50
    for i, (num, label) in enumerate(stats):
        x = stat_x + i * 160
        c.setFillColor(CYAN)
        c.setFont("Helvetica-Bold", 32)
        c.drawString(x, stat_y, num)
        c.setFillColor(Color(1, 1, 1, 0.6))
        c.setFont("Helvetica", 10)
        for j, line in enumerate(label.split("\n")):
            c.drawString(x, stat_y - 20 - j * 14, line)

    # Bottom branding
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, 80, "TravelSuite")
    c.setFillColor(Color(1, 1, 1, 0.5))
    c.setFont("Helvetica", 10)
    c.drawString(50, 60, "The Operating System for Modern Travel Agencies")

    # Bottom accent
    c.setFillColor(CYAN)
    c.rect(0, 0, w, 4, fill=1, stroke=0)

    c.restoreState()


def page_header_footer(canvas_obj, doc):
    """Standard page header and footer."""
    c = canvas_obj
    w, h = A4
    c.saveState()

    # Top accent line
    c.setStrokeColor(CYAN)
    c.setLineWidth(2)
    c.line(LEFT_MARGIN, h - 35, w - RIGHT_MARGIN, h - 35)

    # Header branding
    c.setFillColor(CYAN_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(LEFT_MARGIN, h - 28, "TravelSuite")
    c.setFillColor(TEXT_LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(w - RIGHT_MARGIN, h - 28, "The 2024 Agency Scaling Blueprint")

    # Footer
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(0.5)
    c.line(LEFT_MARGIN, 40, w - RIGHT_MARGIN, 40)

    c.setFillColor(TEXT_LIGHT)
    c.setFont("Helvetica", 8)
    c.drawString(LEFT_MARGIN, 26, "travelsuite.in")
    c.drawCentredString(w / 2, 26, f"Page {doc.page}")
    c.drawRightString(w - RIGHT_MARGIN, 26, "Free Guide - Do Not Distribute")

    c.restoreState()


def cta_page(canvas_obj, doc):
    """Final CTA page with dark background."""
    c = canvas_obj
    w, h = A4
    c.saveState()

    c.setFillColor(DARK_BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Decorative elements
    c.setFillColor(Color(0, 0.94, 1, 0.06))
    c.circle(w / 2, h / 2 + 100, 250, fill=1, stroke=0)
    c.setFillColor(Color(1, 0.6, 0.2, 0.04))
    c.circle(100, 150, 180, fill=1, stroke=0)

    # Top accent
    c.setFillColor(CYAN)
    c.rect(0, h - 6, w, 6, fill=1, stroke=0)
    c.rect(0, 0, w, 4, fill=1, stroke=0)

    c.restoreState()


# ─── Helper Functions ───

def make_comparison_table(data, col_widths, styles_dict):
    """Create a styled comparison table."""
    table = Table(data, colWidths=col_widths)
    style_commands = [
        ("BACKGROUND", (0, 0), (-1, 0), CYAN_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, VERY_LIGHT_GRAY]),
    ]
    table.setStyle(TableStyle(style_commands))
    return table


def make_simple_table(data, col_widths):
    """Create a simple styled table."""
    table = Table(data, colWidths=col_widths)
    style_commands = [
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#F0FDFA")),
        ("TEXTCOLOR", (0, 0), (-1, 0), CYAN_DARK),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_MEDIUM),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, VERY_LIGHT_GRAY]),
    ]
    table.setStyle(TableStyle(style_commands))
    return table


def bullet_list(items, styles_dict, indent=20):
    """Create a formatted bullet list."""
    elements = []
    bullet_style = ParagraphStyle(
        "BulletItem", fontName="Helvetica", fontSize=10.5,
        leading=16, textColor=TEXT_MEDIUM, leftIndent=indent,
        spaceAfter=3
    )
    for item in items:
        elements.append(Paragraph(f"<bullet>&bull;</bullet> {item}", bullet_style))
    return elements


def chapter_header(number, title, styles_dict):
    """Create a chapter header with number accent."""
    elements = []
    elements.append(Spacer(1, 5))
    chapter_num_style = ParagraphStyle(
        "ChapterNum", fontName="Helvetica-Bold", fontSize=13,
        leading=16, textColor=CYAN_DARK, spaceAfter=2
    )
    elements.append(Paragraph(f"CHAPTER {number}", chapter_num_style))
    elements.append(DividerLine(80, CYAN, 2))
    elements.append(Paragraph(title, styles_dict["h1"]))
    elements.append(Spacer(1, 6))
    return elements


# ─── Document Content ───

def build_document():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Use BaseDocTemplate for proper multi-template support
    from reportlab.platypus import BaseDocTemplate

    normal_frame = Frame(LEFT_MARGIN, 55, CONTENT_WIDTH, HEIGHT - 110,
                         id='normal', showBoundary=0)
    # Cover page: tiny frame since content is drawn directly on canvas
    cover_frame = Frame(LEFT_MARGIN, 55, CONTENT_WIDTH, 10,
                        id='cover', showBoundary=0)
    # CTA page: frame for flowable content on dark background
    cta_frame = Frame(LEFT_MARGIN, 55, CONTENT_WIDTH, HEIGHT - 110,
                      id='cta', showBoundary=0)

    cover_template = PageTemplate(id='Cover', frames=[cover_frame],
                                   onPage=lambda c, d: cover_page(c, d))
    normal_template = PageTemplate(id='Normal', frames=[normal_frame],
                                    onPage=lambda c, d: page_header_footer(c, d))
    cta_template = PageTemplate(id='CTA', frames=[cta_frame],
                                 onPage=lambda c, d: cta_page(c, d))

    doc = BaseDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=55,
        bottomMargin=55,
        title="The 2024 Agency Scaling Blueprint",
        author="TravelSuite",
        subject="How Top Travel Agencies Use Automation to Scale",
        creator="TravelSuite - travelsuite.in",
    )
    doc.addPageTemplates([cover_template, normal_template, cta_template])

    S = get_styles()
    story = []

    # ═══════════════════════════════════════════════
    # COVER PAGE (page 1) - drawn by cover_page callback
    # ═══════════════════════════════════════════════
    story.append(NextPageTemplate('Normal'))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # TABLE OF CONTENTS (page 2)
    # ═══════════════════════════════════════════════
    story.append(Spacer(1, 20))
    story.append(Paragraph("Table of Contents", S["h1"]))
    story.append(DividerLine(CONTENT_WIDTH, CYAN, 1.5))
    story.append(Spacer(1, 15))

    toc_items = [
        ("01", "The 50 Lakh Problem", "The hidden cost of manual workflows"),
        ("02", "5 Pillars of a Scalable Agency", "The framework top agencies follow"),
        ("03", "The Proposal Revolution", "From static PDFs to 45% higher conversions"),
        ("04", "WhatsApp Automation Playbook", "7 messages that run your business on autopilot"),
        ("05", "The Add-On Revenue Machine", "How to earn 3L+ more without new clients"),
        ("06", "Your 90-Day Scaling Roadmap", "Week-by-week action plan"),
        ("07", "The Technology Stack", "Choosing the right tools for growth"),
    ]

    for num, title, desc in toc_items:
        toc_row = Table(
            [[
                Paragraph(f'<font color="#{CYAN_DARK.hexval()[2:]}">{num}</font>', ParagraphStyle(
                    "tn", fontName="Helvetica-Bold", fontSize=18, textColor=CYAN_DARK, leading=24
                )),
                Paragraph(f'<b>{title}</b><br/><font size="9" color="#{TEXT_LIGHT.hexval()[2:]}">{desc}</font>',
                          ParagraphStyle("td", fontName="Helvetica", fontSize=12, leading=17, textColor=TEXT_DARK))
            ]],
            colWidths=[45, CONTENT_WIDTH - 55]
        )
        toc_row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor("#F3F4F6")),
        ]))
        story.append(toc_row)

    story.append(Spacer(1, 30))
    story.append(Paragraph(
        '<i>"The agencies that will thrive in 2025 are the ones automating today.<br/>'
        'This blueprint is your competitive advantage."</i>',
        S["quote"]
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph("- Team TravelSuite", ParagraphStyle(
        "attr", fontName="Helvetica-Bold", fontSize=10, textColor=CYAN_DARK, alignment=TA_CENTER
    )))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # CHAPTER 1: The 50 Lakh Problem (pages 3-4)
    # ═══════════════════════════════════════════════
    story.extend(chapter_header("01", "The 50 Lakh Problem", S))

    story.append(Paragraph(
        "Every year, the average Indian travel agency loses the equivalent of <b>50 lakh rupees</b> "
        "in productivity to manual workflows. That is not a typo. When you factor in the hours "
        "spent crafting proposals by hand, chasing payments over WhatsApp, tracking clients in "
        "Excel spreadsheets, and coordinating drivers through phone calls, the numbers are staggering.",
        S["body"]
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("The Hidden Cost Breakdown", S["h2"]))

    cost_data = [
        ["Manual Task", "Time Per Instance", "Monthly Hours", "Annual Cost*"],
        ["Creating proposals (PDF/Word)", "2-3 hours each", "40+ hours", "~4.8L"],
        ["WhatsApp follow-ups", "15 min per client", "20+ hours", "~2.4L"],
        ["Excel client tracking", "30 min daily", "10+ hours", "~1.2L"],
        ["Payment collection & reminders", "20 min per booking", "8+ hours", "~0.96L"],
        ["Driver/vendor coordination", "10 min per call", "12+ hours", "~1.44L"],
        ["TOTAL", "", "90+ hours/month", "~10.8L/year"],
    ]

    cost_table = Table(cost_data, colWidths=[155, 115, 100, 100])
    cost_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), CYAN),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("FONTNAME", (0, 1), (-1, -2), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_MEDIUM),
        ("BACKGROUND", (0, -1), (-1, -1), HexColor("#FEF3C7")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, -1), (-1, -1), TEXT_DARK),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [white, VERY_LIGHT_GRAY]),
    ]))
    story.append(cost_table)
    story.append(Paragraph(
        "<i>*Based on average operator salary of 6 LPA and opportunity cost of lost bookings</i>",
        S["small"]
    ))

    story.append(Spacer(1, 14))

    # Stats row
    stats_data = [[
        StatCard(150, 75, "70+", "Hours Lost Monthly", CYAN),
        StatCard(150, 75, "18%", "Avg. PDF Conversion", RED_SOFT),
        StatCard(150, 75, "4.2x", "ROI of Automation", GREEN),
    ]]
    stats_table = Table(stats_data, colWidths=[163, 163, 163])
    stats_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(stats_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("The Manual Tax Calculator", S["h2"]))
    story.append(Paragraph(
        "Use this simple framework to calculate how much manual work is costing <b>your</b> agency. "
        "Fill in your numbers to see the real impact:",
        S["body"]
    ))

    calc_items = [
        "Number of proposals you send per month: ______ x 2.5 hours = ______ hours",
        "Number of active clients: ______ x 0.5 hours (follow-up) = ______ hours",
        "Hours spent on Excel/tracking per week: ______ x 4 = ______ hours/month",
        "Payment reminders sent per month: ______ x 20 min = ______ hours",
        "Driver/vendor calls per week: ______ x 4 = ______ hours/month",
    ]
    for item in calc_items:
        story.append(ChecklistItem(item, CONTENT_WIDTH))

    story.append(Spacer(1, 8))
    story.append(ColoredBox(
        CONTENT_WIDTH, 45, HexColor("#ECFDF5"), [
            ("Helvetica-Bold", 11, GREEN, "YOUR TOTAL: ______ hours/month x 12 = ______ hours/year wasted")
        ], border_color=GREEN, padding=14
    ))

    story.append(Spacer(1, 10))
    story.append(ProTipBox(
        "If your total exceeds 40 hours/month, you are leaving significant money on the table. "
        "The agencies in our network that automated these workflows reported saving an average of "
        "70 hours per month within the first 90 days.",
        CONTENT_WIDTH
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # CHAPTER 2: 5 Pillars of a Scalable Agency (pages 5-7)
    # ═══════════════════════════════════════════════
    story.extend(chapter_header("02", "The 5 Pillars of a Scalable Travel Agency", S))

    story.append(Paragraph(
        "After studying hundreds of travel agencies across India, from solo operators in Jaipur to "
        "50-person teams in Mumbai, we identified five key pillars that separate agencies stuck at "
        "10-20 bookings a month from those consistently closing 100+. Here is the framework.",
        S["body"]
    ))

    pillars = [
        ("Pillar 1: Interactive Proposals", CYAN,
         "Static PDF proposals convert at just 18% on average. Agencies that switched to interactive, "
         "web-based proposals saw conversion rates jump to 34% - a 45% improvement. Interactive proposals "
         "let clients explore itineraries, view real-time pricing, add extras, and book instantly.",
         "Old Way: 2-3 hours per Word/PDF proposal, clients lose the attachment, no tracking.\n"
         "New Way: 5-minute interactive proposals with live tracking and one-click booking."),

        ("Pillar 2: Automated Client Communication", ORANGE,
         "Indian travelers overwhelmingly prefer WhatsApp for business communication. Yet most agencies "
         "still send every message manually - booking confirmations, payment reminders, trip updates. "
         "Automation handles 80% of routine messages while keeping the personal touch.",
         "Old Way: 15+ manual WhatsApp messages per booking, messages forgotten, no audit trail.\n"
         "New Way: Automated flows triggered by booking events, all logged in CRM."),

        ("Pillar 3: Smart CRM Pipeline", PURPLE,
         "Excel sheets cannot tell you which leads are hot, which proposals need follow-up, or which "
         "clients are about to travel. A pipeline-based CRM shows every client's journey at a glance - "
         "from new inquiry to post-trip review - so nothing falls through the cracks.",
         "Old Way: Excel sheets, sticky notes, things slip through, no visibility for team.\n"
         "New Way: Visual pipeline with automatic status updates and team collaboration."),

        ("Pillar 4: Revenue Optimization", GREEN,
         "The most profitable agencies do not just sell trips - they sell experiences. Add-on services "
         "like airport transfers, spa packages, adventure activities, and travel insurance can increase "
         "revenue per booking by 30% or more. The key is making it frictionless for clients to say yes.",
         "Old Way: Occasional upselling via phone/WhatsApp, no catalog, no tracking.\n"
         "New Way: One-click add-on marketplace embedded in every proposal."),

        ("Pillar 5: Data-Driven Decisions", BLUE_SOFT,
         "How many proposals did you send last month? What is your average booking value? Which destinations "
         "convert best? If you cannot answer these questions instantly, you are flying blind. Data-driven "
         "agencies make smarter decisions about pricing, marketing, and resource allocation.",
         "Old Way: End-of-month guesswork, no real metrics, gut-feel decisions.\n"
         "New Way: Real-time dashboards showing revenue, conversions, and client pipeline."),
    ]

    for title, color, desc, comparison in pillars:
        story.append(Spacer(1, 6))
        pillar_title_style = ParagraphStyle(
            "PillarTitle", fontName="Helvetica-Bold", fontSize=14,
            leading=20, textColor=color, spaceBefore=6, spaceAfter=4
        )
        story.append(Paragraph(title, pillar_title_style))
        story.append(Paragraph(desc, S["body"]))

        comp_lines = comparison.split("\n")
        for line in comp_lines:
            if line.startswith("Old Way:"):
                story.append(Paragraph(
                    f'<font color="#{RED_SOFT.hexval()[2:]}"><b>&#10007;</b></font> {line}',
                    S["body"]
                ))
            elif line.startswith("New Way:"):
                story.append(Paragraph(
                    f'<font color="#{GREEN.hexval()[2:]}"><b>&#10003;</b></font> {line}',
                    S["body"]
                ))

    story.append(Spacer(1, 10))
    story.append(ProTipBox(
        "You do not need to implement all five pillars at once. Start with Pillar 1 (Interactive Proposals) "
        "as it has the highest immediate ROI - agencies typically see a 45% conversion boost within the first month.",
        CONTENT_WIDTH
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # CHAPTER 3: The Proposal Revolution (pages 8-10)
    # ═══════════════════════════════════════════════
    story.extend(chapter_header("03", "The Proposal Revolution", S))

    story.append(Paragraph(
        "Your proposal is the single most important touchpoint in the entire sales process. It is where "
        "a curious lead becomes a paying client - or where you lose them forever. Yet most agencies are "
        "still sending static PDF proposals that look like they were made in 2010.",
        S["body"]
    ))

    story.append(Paragraph("Why Static PDFs Are Killing Your Conversions", S["h2"]))

    pdf_problems = [
        "<b>No engagement tracking</b> - You have no idea if the client even opened it",
        "<b>Buried in email</b> - Attachments get lost in overflowing inboxes",
        "<b>No interactivity</b> - Clients cannot explore, customize, or book directly",
        "<b>Slow to create</b> - 2-3 hours per proposal means fewer proposals sent",
        "<b>Outdated instantly</b> - Prices change, availability shifts, but the PDF stays static",
        "<b>No mobile optimization</b> - 72% of Indian travelers browse on mobile",
    ]
    for item in pdf_problems:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", S["bullet"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Case Study: Go Buddy Adventures", S["h2"]))

    story.append(ColoredBox(
        CONTENT_WIDTH, 110, HexColor("#F0FDFA"), [
            ("Helvetica-Bold", 12, CYAN_DARK, "Go Buddy Adventures - Hyderabad"),
            ("Helvetica", 10, TEXT_MEDIUM, "Specializing in trekking, snow expeditions, and adventure tourism"),
            ("Helvetica", 10, TEXT_MEDIUM, ""),
            ("Helvetica-Bold", 10, TEXT_DARK, "Before: 18% proposal conversion rate, 2.5 hours per proposal"),
            ("Helvetica-Bold", 10, GREEN, "After: 34% conversion rate (+89%), 5 minutes per proposal"),
            ("Helvetica-Bold", 10, CYAN_DARK, "Result: 45% more bookings in the first quarter"),
        ],
        border_color=CYAN_DARK, padding=14
    ))

    story.append(Spacer(1, 12))
    story.append(Paragraph("The 5-Minute Proposal Framework", S["h2"]))
    story.append(Paragraph(
        "Here is the exact framework top-performing agencies use to create proposals that convert:",
        S["body"]
    ))

    steps = [
        ("Select Template", "Choose from destination-specific templates pre-loaded with popular itineraries, "
         "local activities, and seasonal pricing. No starting from scratch."),
        ("Customize Itinerary", "Drag and drop activities, adjust dates, modify accommodation levels. "
         "The proposal updates in real-time with accurate pricing."),
        ("Add Smart Extras", "Include one-click add-ons like airport transfers, travel insurance, "
         "and experience upgrades. These alone can increase booking value by 30%."),
        ("Preview & Send", "Preview exactly what the client will see on mobile and desktop. "
         "Send via WhatsApp link or email with one click."),
        ("Track & Close", "See when the client opens the proposal, which sections they spend time on, "
         "and follow up at the perfect moment."),
    ]

    for i, (title, desc) in enumerate(steps, 1):
        story.append(NumberedStep(i, title, desc, CONTENT_WIDTH))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))
    story.append(Paragraph("The Perfect Proposal Checklist", S["h2"]))

    checklist_items = [
        "Stunning hero image of the destination",
        "Day-by-day itinerary with activities and timing",
        "Clear pricing with breakdown (no hidden costs)",
        "High-quality photos for each activity/hotel",
        "Add-on options (transfers, insurance, upgrades)",
        "Client testimonials or social proof",
        "Easy payment options (UPI, cards, EMI)",
        "Mobile-responsive design",
        "One-click booking button",
        "Your agency branding and contact details",
    ]
    for item in checklist_items:
        story.append(ChecklistItem(item, CONTENT_WIDTH))

    story.append(Spacer(1, 8))
    story.append(ProTipBox(
        "The most successful proposals include a 'Why Book With Us' section featuring 2-3 client "
        "testimonials and your agency's unique differentiators. Social proof increases conversion by up to 15%.",
        CONTENT_WIDTH
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # CHAPTER 4: WhatsApp Automation Playbook (pages 11-13)
    # ═══════════════════════════════════════════════
    story.extend(chapter_header("04", "WhatsApp Automation Playbook", S))

    story.append(Paragraph(
        "WhatsApp is not just a messaging app in India - it is the primary business communication "
        "channel. With 500+ million users in India and a 98% open rate (compared to 20% for email), "
        "WhatsApp is where your clients expect to hear from you. The question is: are you using it "
        "efficiently, or is it eating your entire day?",
        S["body"]
    ))

    story.append(Spacer(1, 6))

    whatsapp_stats = [
        ["Metric", "WhatsApp", "Email", "Phone Call"],
        ["Open Rate", "98%", "20%", "N/A"],
        ["Response Time", "< 2 min", "6+ hours", "Immediate"],
        ["Client Preference (India)", "87%", "8%", "5%"],
        ["Automation Potential", "High", "High", "None"],
        ["Cost per Message", "Near zero", "Near zero", "Telecom charges"],
    ]
    wa_table = make_comparison_table(whatsapp_stats, [130, 100, 100, 130], S)
    story.append(wa_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("The 7 Automated Messages Every Agency Needs", S["h2"]))

    messages = [
        ("Booking Confirmation", "Sent immediately when a client books",
         "Hi [Name]! Your [Destination] trip is confirmed! Here are your booking details:\n"
         "Dates: [Start] - [End] | Guests: [Count] | Booking ID: [ID]\n"
         "Your interactive itinerary: [Link]\nQuestions? We are here to help!"),

        ("Payment Reminder (3-Day)", "Sent 3 days before payment due date",
         "Hi [Name], friendly reminder that your payment of [Amount] for your [Destination] "
         "trip is due on [Date]. Pay securely here: [Payment Link]\nNeed an EMI option? Just reply!"),

        ("Pre-Trip Checklist", "Sent 5 days before departure",
         "Hi [Name]! Your [Destination] trip is just 5 days away! Here is your pre-trip checklist:\n"
         "Passport/ID valid? | Forex arranged? | Travel insurance active? | Packing done?\n"
         "Download your complete itinerary: [Link]"),

        ("Driver Confirmation", "Sent morning of pickup",
         "Hi [Name], your driver [Driver Name] will pick you up at [Time] from [Location].\n"
         "Vehicle: [Details] | Driver contact: [Phone]\nTrack your ride: [Link]"),

        ("Activity Update", "Sent morning of each day during trip",
         "Good morning [Name]! Today's adventure:\n"
         "[Activity 1] at [Time] | [Activity 2] at [Time]\n"
         "Weather: [Forecast] | Tip: [Local tip]\nEnjoy your day!"),

        ("Post-Trip Review", "Sent 2 days after return",
         "Hi [Name]! Hope you had an amazing time in [Destination]!\n"
         "We would love your feedback - it helps us serve you better: [Review Link]\n"
         "As a thank you, here is 10% off your next booking: [Coupon Code]"),

        ("Re-engagement", "Sent 90 days after last trip",
         "Hi [Name]! It has been a while since your incredible [Destination] trip.\n"
         "We have curated some new experiences we think you will love: [Recommendations Link]\n"
         "Book before [Date] and get an exclusive returning traveler discount!"),
    ]

    for i, (title, trigger, template) in enumerate(messages, 1):
        story.append(Spacer(1, 6))
        msg_title = ParagraphStyle(
            "MsgTitle", fontName="Helvetica-Bold", fontSize=11,
            leading=16, textColor=GREEN, spaceAfter=2
        )
        story.append(Paragraph(f"Message {i}: {title}", msg_title))
        story.append(Paragraph(f"<i>Trigger: {trigger}</i>", S["small"]))

        template_lines = template.split("\n")
        formatted_lines = []
        for line in template_lines:
            formatted_lines.append(("Helvetica", 9, TEXT_MEDIUM, line))

        story.append(ColoredBox(
            CONTENT_WIDTH, 15 + len(template_lines) * 17, HexColor("#F0FDF4"),
            formatted_lines,
            border_color=HexColor("#BBF7D0"), padding=10, font_size=9
        ))

    story.append(Spacer(1, 12))

    story.append(Paragraph("Automation ROI Calculator", S["h2"]))

    roi_data = [
        ["Message Type", "Manual Time", "Automated Time", "Monthly Savings"],
        ["Booking confirmations", "10 min", "0 min", "5+ hours"],
        ["Payment reminders", "15 min", "0 min", "4+ hours"],
        ["Pre-trip checklists", "20 min", "0 min", "3+ hours"],
        ["Driver coordination", "10 min/call", "0 min", "4+ hours"],
        ["Daily updates", "15 min", "0 min", "6+ hours"],
        ["Review requests", "5 min", "0 min", "1.5+ hours"],
        ["Re-engagement", "10 min", "0 min", "2+ hours"],
        ["TOTAL SAVED", "", "", "25+ hours/month"],
    ]
    roi_table = Table(roi_data, colWidths=[140, 95, 95, 130])
    roi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("FONTNAME", (0, 1), (-1, -2), "Helvetica"),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_MEDIUM),
        ("BACKGROUND", (0, -1), (-1, -1), HexColor("#ECFDF5")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, -1), (-1, -1), GREEN),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [white, VERY_LIGHT_GRAY]),
    ]))
    story.append(roi_table)

    story.append(Spacer(1, 10))
    story.append(ProTipBox(
        "Start with just messages 1 and 2 (booking confirmation and payment reminder). These two alone "
        "will save you 9+ hours per month and dramatically improve your client experience. Add the "
        "remaining messages one at a time as you get comfortable with automation.",
        CONTENT_WIDTH
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # CHAPTER 5: The Add-On Revenue Machine (pages 14-15)
    # ═══════════════════════════════════════════════
    story.extend(chapter_header("05", "The Add-On Revenue Machine", S))

    story.append(Paragraph(
        "Here is a fact that will change how you think about your business: <b>it costs 5-7x more to "
        "acquire a new client than to sell more to an existing one</b>. The most profitable travel agencies "
        "in India are not necessarily the ones with the most clients - they are the ones that maximize "
        "revenue per booking through strategic add-on selling.",
        S["body"]
    ))

    story.append(Spacer(1, 6))

    # Revenue impact stats
    revenue_stats = [[
        StatCard(155, 75, "+30%", "Revenue Per Booking", ORANGE),
        StatCard(155, 75, "3L+", "Monthly Add-On Revenue", GREEN),
        StatCard(155, 75, "72%", "Clients Want Extras", CYAN),
    ]]
    rev_table = Table(revenue_stats, colWidths=[163, 163, 163])
    rev_table.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(rev_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph("Top 10 High-Margin Add-Ons for Indian Tour Operators", S["h2"]))

    addon_data = [
        ["Add-On Service", "Avg. Price", "Margin", "Demand Level"],
        ["Airport Transfers (Private)", "1,500 - 4,000", "40-50%", "Very High"],
        ["Travel Insurance", "800 - 2,500", "60-70%", "High"],
        ["Adventure Activities", "2,000 - 8,000", "25-35%", "High"],
        ["Spa & Wellness Packages", "3,000 - 10,000", "35-45%", "Medium-High"],
        ["Candlelight Dinner Setup", "4,000 - 12,000", "40-55%", "Medium"],
        ["Photography Packages", "5,000 - 15,000", "50-60%", "Growing"],
        ["Visa Assistance", "2,000 - 5,000", "70-80%", "High"],
        ["Local SIM/WiFi", "500 - 1,500", "50-60%", "High"],
        ["Room/Flight Upgrades", "3,000 - 20,000", "20-30%", "Medium"],
        ["Cultural Experiences", "1,500 - 6,000", "30-40%", "Growing"],
    ]
    addon_table = Table(addon_data, colWidths=[160, 100, 80, 120])
    addon_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_MEDIUM),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, VERY_LIGHT_GRAY]),
    ]))
    story.append(addon_table)
    story.append(Paragraph("<i>*Prices in INR. Margins vary by supplier and destination.</i>", S["small"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("The One-Click Upsell Strategy", S["h2"]))

    story.append(Paragraph(
        "The secret to maximizing add-on revenue is <b>reducing friction to zero</b>. When a client "
        "has to call you, wait for a quote, and then transfer money separately, the drop-off rate is "
        "enormous. But when they can browse a curated marketplace and add extras with a single click "
        "while viewing their proposal, the uptake rate skyrockets.",
        S["body"]
    ))

    story.append(Paragraph("The framework is simple:", S["body_bold"]))

    upsell_steps = [
        ("Embed in Proposal", "Add-ons appear as beautifully designed cards within the interactive "
         "proposal. Clients see options while they are most excited about the trip."),
        ("Curate by Destination", "Show only relevant add-ons. A Bali proposal shows temple tours "
         "and surf lessons, not ski packages. Relevance drives conversion."),
        ("Price Transparently", "Show the exact price and what is included. No 'call for pricing' - "
         "that kills momentum. Include photos and brief descriptions."),
        ("One-Click Add", "Client taps 'Add to Trip' and it is instantly added to their booking "
         "total. No separate invoices, no back-and-forth."),
    ]
    for i, (title, desc) in enumerate(upsell_steps, 1):
        story.append(NumberedStep(i, title, desc, CONTENT_WIDTH, ORANGE))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 8))

    # Revenue calculation example
    story.append(ColoredBox(
        CONTENT_WIDTH, 100, HexColor("#FFF7ED"), [
            ("Helvetica-Bold", 12, ORANGE, "Quick Revenue Math"),
            ("Helvetica", 10, TEXT_MEDIUM, ""),
            ("Helvetica", 10, TEXT_MEDIUM, "If you handle 30 bookings/month with avg. value of 50,000:"),
            ("Helvetica", 10, TEXT_MEDIUM, "Current monthly revenue: 15,00,000"),
            ("Helvetica-Bold", 10, GREEN, "With 30% add-on uplift: 19,50,000 (+4,50,000/month)"),
            ("Helvetica-Bold", 10, ORANGE, "Annual additional revenue: 54,00,000 (54 Lakhs!)"),
        ],
        border_color=ORANGE, padding=12
    ))

    story.append(Spacer(1, 8))
    story.append(ProTipBox(
        "Start by adding just your top 3 highest-margin add-ons to proposals. Airport transfers, travel "
        "insurance, and one experience-based add-on (photography, dinner, adventure) will cover 70% "
        "of potential upsell revenue.",
        CONTENT_WIDTH
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # CHAPTER 6: 90-Day Scaling Roadmap (pages 16-17)
    # ═══════════════════════════════════════════════
    story.extend(chapter_header("06", "Your 90-Day Scaling Roadmap", S))

    story.append(Paragraph(
        "Theory is great, but execution is everything. Here is a proven 90-day roadmap that has helped "
        "agencies across India transform their operations. Follow this week by week, and you will see "
        "measurable results within the first 30 days.",
        S["body"]
    ))

    story.append(Spacer(1, 8))

    # Month 1
    story.append(Paragraph("Month 1: Foundation", ParagraphStyle(
        "M1", fontName="Helvetica-Bold", fontSize=16, leading=22, textColor=CYAN_DARK, spaceAfter=6
    )))

    m1_data = [
        ["Week", "Focus Area", "Action Items", "KPI Target"],
        ["Week 1", "Audit & Setup",
         "Audit current workflow, identify bottlenecks, set up digital tools, import client database",
         "100% clients imported"],
        ["Week 2", "Proposal System",
         "Create 5 destination templates, set up interactive proposal flow, train team on new process",
         "First 10 interactive proposals sent"],
        ["Week 3", "CRM Pipeline",
         "Define pipeline stages, migrate leads from Excel, set up lead scoring rules",
         "All active leads in CRM"],
        ["Week 4", "Measure & Adjust",
         "Review proposal open rates, track conversion changes, identify friction points",
         "Baseline metrics established"],
    ]
    m1_table = make_simple_table(m1_data, [55, 90, 240, 100])
    story.append(m1_table)

    story.append(Spacer(1, 12))

    # Month 2
    story.append(Paragraph("Month 2: Automation", ParagraphStyle(
        "M2", fontName="Helvetica-Bold", fontSize=16, leading=22, textColor=ORANGE, spaceAfter=6
    )))

    m2_data = [
        ["Week", "Focus Area", "Action Items", "KPI Target"],
        ["Week 5", "WhatsApp Automation",
         "Set up booking confirmations and payment reminders, create message templates",
         "2 automated flows live"],
        ["Week 6", "Payment Integration",
         "Connect Razorpay/Stripe, add payment links to proposals, set up EMI options",
         "50% bookings paid online"],
        ["Week 7", "Driver Management",
         "Add driver database, set up auto-assignments, enable client-facing driver details",
         "Zero manual driver calls"],
        ["Week 8", "Full Automation Audit",
         "Review all automation flows, fix edge cases, add pre-trip and post-trip messages",
         "5+ automated flows live"],
    ]
    m2_table = make_simple_table(m2_data, [55, 90, 240, 100])
    story.append(m2_table)

    story.append(Spacer(1, 12))

    # Month 3
    story.append(Paragraph("Month 3: Growth", ParagraphStyle(
        "M3", fontName="Helvetica-Bold", fontSize=16, leading=22, textColor=GREEN, spaceAfter=6
    )))

    m3_data = [
        ["Week", "Focus Area", "Action Items", "KPI Target"],
        ["Week 9", "Add-On Marketplace",
         "Curate top 5 add-ons per destination, add to all proposal templates, set pricing",
         "Add-ons in 100% of proposals"],
        ["Week 10", "Analytics & Reporting",
         "Set up revenue dashboard, track team performance, review add-on uptake rates",
         "Weekly reports automated"],
        ["Week 11", "Scale Team",
         "Onboard additional team members, document SOPs, delegate proposal creation",
         "Team handling 50%+ proposals"],
        ["Week 12", "Optimize & Celebrate",
         "A/B test proposal designs, optimize WhatsApp timing, plan next quarter targets",
         "30%+ improvement in key metrics"],
    ]
    m3_table = make_simple_table(m3_data, [55, 90, 240, 100])
    story.append(m3_table)

    story.append(Spacer(1, 12))

    story.append(Paragraph("KPIs to Track at Every Stage", S["h2"]))

    kpi_items = [
        "<b>Proposal Conversion Rate</b> - Target: 30%+ (up from industry avg of 18%)",
        "<b>Average Booking Value</b> - Target: 20-30% increase via add-ons",
        "<b>Time Per Proposal</b> - Target: Under 10 minutes (down from 2+ hours)",
        "<b>Client Response Time</b> - Target: Under 2 hours (via WhatsApp automation)",
        "<b>Monthly Revenue Per Team Member</b> - Target: 2x improvement by Month 3",
        "<b>Repeat Client Rate</b> - Target: 25%+ (via re-engagement campaigns)",
    ]
    for item in kpi_items:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", S["bullet"]))

    story.append(Spacer(1, 8))
    story.append(ProTipBox(
        "Do not try to skip ahead. Agencies that rush through Month 1 often have to restart because "
        "their foundation is shaky. A solid client database and proposal system are prerequisites for "
        "automation - build the foundation first.",
        CONTENT_WIDTH
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # CHAPTER 7: Technology Stack (page 18)
    # ═══════════════════════════════════════════════
    story.extend(chapter_header("07", "The Technology Stack", S))

    story.append(Paragraph(
        "Choosing the right technology is the difference between a smooth scaling journey and a "
        "frustrating patchwork of disconnected tools. Here is what to look for in a travel agency "
        "operating system, and how to evaluate your options.",
        S["body"]
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Must-Have Feature Checklist", S["h2"]))

    feature_comparison = [
        ["Feature", "Generic CRM", "Manual Tools", "Travel Agency OS"],
        ["Interactive proposals", "No", "No", "Yes"],
        ["WhatsApp automation", "Limited", "No", "Built-in"],
        ["Travel-specific CRM", "Generic only", "Excel sheets", "Purpose-built"],
        ["Add-on marketplace", "No", "No", "Yes"],
        ["Amadeus/GDS integration", "No", "Manual search", "Integrated"],
        ["Driver management", "No", "Phone calls", "Automated"],
        ["Payment collection", "Separate tool", "Manual", "Built-in"],
        ["Client-facing itinerary", "No", "PDF only", "Interactive web"],
        ["Real-time analytics", "Basic", "None", "Travel-specific"],
        ["Mobile-first design", "Varies", "N/A", "Yes"],
        ["India-specific (UPI, INR)", "Rarely", "Manual", "Native support"],
        ["WhatsApp-first comms", "No", "Manual", "Integrated"],
    ]

    fc_table = Table(feature_comparison, colWidths=[150, 95, 95, 120])
    fc_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), CYAN),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("TEXTCOLOR", (0, 1), (0, -1), TEXT_DARK),
        ("TEXTCOLOR", (1, 1), (1, -1), RED_SOFT),
        ("TEXTCOLOR", (2, 1), (2, -1), RED_SOFT),
        ("TEXTCOLOR", (3, 1), (3, -1), GREEN),
        ("FONTNAME", (3, 1), (3, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, VERY_LIGHT_GRAY]),
    ]))
    story.append(fc_table)

    story.append(Spacer(1, 14))

    story.append(ColoredBox(
        CONTENT_WIDTH, 120, HexColor("#F0F9FF"), [
            ("Helvetica-Bold", 14, CYAN_DARK, "Why TravelSuite Checks Every Box"),
            ("Helvetica", 10, TEXT_MEDIUM, ""),
            ("Helvetica", 10, TEXT_MEDIUM, "TravelSuite was built by tour operators, for tour operators. Unlike generic"),
            ("Helvetica", 10, TEXT_MEDIUM, "CRMs or cobbled-together tool stacks, it is a purpose-built operating system"),
            ("Helvetica", 10, TEXT_MEDIUM, "designed specifically for the Indian travel industry."),
            ("Helvetica", 10, TEXT_MEDIUM, ""),
            ("Helvetica-Bold", 10, CYAN_DARK, "Every feature in the checklist above? Built-in from day one."),
            ("Helvetica", 10, TEXT_MEDIUM, "No integrations to manage. No plugins to install. It just works."),
        ],
        border_color=CYAN_DARK, padding=14
    ))

    story.append(Spacer(1, 12))

    story.append(Paragraph("What Our Operators Are Saying", S["h2"]))

    testimonials = [
        ("Priya Sharma, WanderLust Tours (Mumbai)",
         "We went from 15 bookings a month to 38 in just 90 days. The interactive proposals are a game-changer - clients love being able to explore and customize their trips."),
        ("Rajesh Kumar, Incredible India Tours (Delhi)",
         "I used to spend my entire Sunday creating proposals. Now I send 5 proposals before my morning chai. The WhatsApp automation alone saved us 20 hours a month."),
        ("Meena Patel, Spice Route Travels (Ahmedabad)",
         "The add-on marketplace generated 2.8 lakh in additional revenue in our first month. Clients were already wanting these services - we just made it easy to say yes."),
    ]

    for name, quote in testimonials:
        story.append(Spacer(1, 4))
        story.append(Paragraph(f'<i>"{quote}"</i>', ParagraphStyle(
            "TestQuote", fontName="Helvetica-Oblique", fontSize=10,
            leading=15, textColor=TEXT_MEDIUM, leftIndent=15, rightIndent=15, spaceAfter=2
        )))
        story.append(Paragraph(f"- {name}", ParagraphStyle(
            "TestAttr", fontName="Helvetica-Bold", fontSize=9,
            leading=12, textColor=CYAN_DARK, leftIndent=15, spaceAfter=8
        )))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # FINAL PAGE: Call to Action (page 19)
    # ═══════════════════════════════════════════════
    story.append(NextPageTemplate('CTA'))
    story.append(PageBreak())

    story.append(Spacer(1, 80))
    cta_title_style = ParagraphStyle(
        "CTATitle", fontName="Helvetica-Bold", fontSize=32,
        leading=40, textColor=white, alignment=TA_CENTER, spaceAfter=10
    )
    story.append(Paragraph("Ready to Scale<br/>Your Agency?", cta_title_style))

    story.append(Spacer(1, 10))
    story.append(DividerLine(100, CYAN, 3))
    story.append(Spacer(1, 15))

    cta_body = ParagraphStyle(
        "CTABody", fontName="Helvetica", fontSize=14,
        leading=22, textColor=Color(1, 1, 1, 0.7), alignment=TA_CENTER, spaceAfter=8
    )
    story.append(Paragraph(
        "You have the blueprint. You have the frameworks.<br/>"
        "Now it is time to put them into action.",
        cta_body
    ))

    story.append(Spacer(1, 20))

    # CTA box
    cta_highlight = ParagraphStyle(
        "CTAHighlight", fontName="Helvetica-Bold", fontSize=18,
        leading=26, textColor=CYAN, alignment=TA_CENTER, spaceAfter=6
    )
    story.append(Paragraph("Start Your Free 14-Day Trial", cta_highlight))
    story.append(Paragraph(
        "No credit card required. Set up in under 5 minutes.",
        ParagraphStyle("CTASub", fontName="Helvetica", fontSize=12,
                       leading=18, textColor=Color(1, 1, 1, 0.6), alignment=TA_CENTER, spaceAfter=15)
    ))

    story.append(Paragraph(
        "travelsuite.in",
        ParagraphStyle("CTAUrl", fontName="Helvetica-Bold", fontSize=22,
                       leading=28, textColor=ORANGE, alignment=TA_CENTER, spaceAfter=25)
    ))

    # What you get
    cta_features = [
        "Unlimited interactive proposals",
        "WhatsApp automation engine",
        "Built-in CRM pipeline",
        "Add-on marketplace",
        "Amadeus flight & hotel search",
        "Payment collection (Razorpay + Stripe)",
    ]

    for feat in cta_features:
        story.append(Paragraph(
            f'<font color="#{CYAN.hexval()[2:]}">&#10003;</font>  {feat}',
            ParagraphStyle("CTAFeat", fontName="Helvetica", fontSize=12,
                           leading=20, textColor=Color(1, 1, 1, 0.8), alignment=TA_CENTER)
        ))

    story.append(Spacer(1, 30))
    story.append(Paragraph(
        "Join 500+ Indian tour operators already scaling with TravelSuite",
        ParagraphStyle("CTASocial", fontName="Helvetica-Bold", fontSize=11,
                       leading=16, textColor=Color(1, 1, 1, 0.5), alignment=TA_CENTER, spaceAfter=20)
    ))

    story.append(Spacer(1, 15))

    # Contact info
    contact_style = ParagraphStyle(
        "Contact", fontName="Helvetica", fontSize=10,
        leading=16, textColor=Color(1, 1, 1, 0.4), alignment=TA_CENTER
    )
    story.append(Paragraph("team@travelsuite.in  |  travelsuite.in", contact_style))
    story.append(Paragraph("Built by tour operators, for tour operators.", contact_style))

    # ─── Build PDF ───
    doc.build(story)
    print(f"PDF generated: {OUTPUT_FILE}")


if __name__ == "__main__":
    build_document()
