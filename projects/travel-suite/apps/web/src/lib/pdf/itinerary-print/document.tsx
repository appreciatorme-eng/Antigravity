/* eslint-disable @next/next/no-img-element, @next/next/no-head-element */
import React from 'react';
import { prerender } from 'react-dom/static';
import type { ItineraryTemplateId } from '@/components/pdf/itinerary-types';
import type {
  PreparedPrintAccommodation,
  PreparedPrintActivity,
  PreparedPrintAddOn,
  PreparedPrintPayload,
} from './assets';

const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&family=Noto+Serif:wght@400;600;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 0;
  }

  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: "Noto Sans", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    counter-reset: pdfPage;
  }

  .page {
    position: relative;
    width: 210mm;
    height: 297mm;
    min-height: 296mm;
    page-break-after: always;
    overflow: hidden;
    counter-increment: pdfPage;
  }

  .page:last-child { page-break-after: auto; }
  .page--light { background: #f8f6f1; color: #171717; }
  .page--white { background: #ffffff; color: #111827; }
  .page--dark { background: #09090b; color: #f8fafc; }
  .page__inner { padding: 14mm 16mm 14mm; position: relative; height: 297mm; min-height: 297mm; }
  .page__inner--wide { padding: 0; height: 297mm; min-height: 297mm; }
  .page__footer {
    position: absolute;
    left: 16mm;
    right: 16mm;
    bottom: 10mm;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(17, 24, 39, 0.55);
  }
  .page--dark .page__footer { color: rgba(248, 250, 252, 0.55); }
  .page__number::after { content: counter(pdfPage); }

  .brand-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12mm;
  }
  .brand-mark {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  .brand-logo {
    max-width: 110px;
    max-height: 44px;
    object-fit: contain;
  }
  .brand-meta {
    min-width: 0;
  }
  .brand-name {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .brand-contact {
    margin-top: 4px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.66;
  }
  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid rgba(17,24,39,0.10);
    border-radius: 999px;
    padding: 7px 11px;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: rgba(255,255,255,0.78);
    color: rgba(17,24,39,0.68);
    font-weight: 700;
    white-space: nowrap;
  }
  .page--dark .brand-badge {
    border-color: rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.06);
    color: rgba(248,250,252,0.72);
  }
  .cover {
    position: relative;
    height: 297mm;
    min-height: 297mm;
  }
  .cover__image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cover__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(9, 9, 11, 0.20), rgba(9, 9, 11, 0.68));
  }
  .cover__content {
    position: relative;
    z-index: 1;
    height: 297mm;
    min-height: 297mm;
    padding: 14mm 16mm 14mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cover__kicker,
  .section-kicker {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    opacity: 0.76;
  }
  .cover__title {
    margin: 12px 0 10px;
    font-size: 34px;
    line-height: 1.02;
    letter-spacing: -0.04em;
    font-weight: 700;
    max-width: 150mm;
  }
  .cover__subtitle {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    max-width: 118mm;
    opacity: 0.88;
  }
  .cover__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }
  .meta-pill {
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 999px;
    padding: 6px 11px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: rgba(255,255,255,0.08);
  }
  .cover-dossier {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-top: 18px;
  }
  .cover-dossier__card {
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 16px;
    padding: 12px 13px;
    background: rgba(18,16,14,0.32);
    backdrop-filter: blur(8px);
  }
  .cover-dossier__label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255,247,237,0.58);
  }
  .cover-dossier__value {
    margin-top: 8px;
    font-size: 15px;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: #fff7ed;
    font-weight: 700;
  }
  .cover-dossier__value--small {
    font-size: 13px;
    line-height: 1.4;
  }
  .trip-brief {
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 10mm;
  }
  .trip-brief__lead {
    display: grid;
    gap: 8mm;
  }
  .trip-brief__headline {
    display: grid;
    gap: 12px;
  }
  .trip-brief__cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .trip-brief__card {
    border: 1px solid rgba(17,24,39,0.08);
    border-radius: 18px;
    padding: 14px;
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,246,241,0.94));
  }
  .trip-brief__label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.54;
  }
  .trip-brief__value {
    margin-top: 8px;
    font-size: 21px;
    line-height: 1.12;
    letter-spacing: -0.03em;
    font-weight: 700;
  }
  .trip-brief__copy {
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.55;
    color: rgba(17,24,39,0.72);
  }
  .trip-brief__sidebar {
    display: grid;
    gap: 8px;
  }
  .trip-brief .lede-serif {
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .operator-card {
    border: 1px solid rgba(17,24,39,0.08);
    border-radius: 18px;
    padding: 16px;
    background: rgba(255,255,255,0.96);
  }
  .operator-card__name {
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.15;
    letter-spacing: -0.03em;
    font-weight: 700;
  }
  .operator-card__copy {
    margin-top: 8px;
    font-size: 11px;
    line-height: 1.6;
    color: rgba(17,24,39,0.74);
  }
  .location-ribbon {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .location-ribbon__stop {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }
  .location-ribbon__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }
  .location-ribbon__name {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(17,24,39,0.62);
  }
  .location-ribbon__line {
    width: 14px;
    height: 1px;
    background: rgba(17,24,39,0.18);
    flex-shrink: 0;
  }
  .day-dossier {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .day-dossier__card {
    border: 1px solid rgba(17,24,39,0.08);
    border-radius: 14px;
    padding: 9px 10px;
    background: rgba(255,255,255,0.92);
  }
  .day-dossier__value {
    margin-top: 6px;
    font-size: 12.5px;
    line-height: 1.25;
    letter-spacing: -0.01em;
    font-weight: 700;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .day-dossier .trip-brief__copy {
    font-size: 10px;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .continuation-layout {
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 10mm;
    align-items: start;
  }
  .continuation-main {
    display: grid;
    gap: 8px;
  }
  .continuation-sidebar {
    display: grid;
    gap: 8px;
  }
  .sidebar-panel {
    border: 1px solid rgba(17,24,39,0.08);
    border-radius: 18px;
    padding: 14px;
    background: rgba(255,255,255,0.96);
  }
  .sidebar-panel--compact {
    border-radius: 15px;
    padding: 10px 11px;
  }
  .sidebar-panel__title {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(17,24,39,0.56);
  }
  .sidebar-panel--compact .sidebar-panel__title {
    margin-bottom: 6px;
    font-size: 9px;
    letter-spacing: 0.14em;
  }
  .stay-card {
    display: grid;
    gap: 10px;
  }
  .stay-card--compact {
    grid-template-columns: 24mm 1fr;
    gap: 8px;
    align-items: start;
  }
  .stay-card__image {
    width: 100%;
    height: 34mm;
    object-fit: cover;
    border-radius: 12px;
    display: block;
    background: rgba(17,24,39,0.06);
  }
  .stay-card--compact .stay-card__image {
    height: 22mm;
    border-radius: 10px;
  }
  .stay-card__title {
    margin: 0;
    font-size: 16px;
    line-height: 1.2;
    letter-spacing: -0.02em;
    font-weight: 700;
  }
  .stay-card--compact .stay-card__title {
    font-size: 13px;
    line-height: 1.18;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .mini-list {
    display: grid;
    gap: 6px;
  }
  .sidebar-panel--compact .mini-list {
    gap: 4px;
  }
  .mini-list__item {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 8px;
    align-items: start;
  }
  .mini-list__text--compact {
    font-size: 10px;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .mini-list__index {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 1px solid rgba(17,24,39,0.12);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(17,24,39,0.6);
  }
  .addon-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .addon-card {
    border: 1px solid rgba(17,24,39,0.08);
    border-radius: 14px;
    overflow: hidden;
    background: rgba(255,255,255,0.96);
  }
  .addon-card__image {
    width: 100%;
    height: 24mm;
    object-fit: cover;
    display: block;
    background: rgba(17,24,39,0.06);
  }
  .addon-card__body {
    padding: 10px 11px 11px;
  }
  .addon-card__title {
    margin: 0;
    font-size: 13px;
    line-height: 1.3;
    letter-spacing: -0.01em;
    font-weight: 700;
  }
  .operator-signoff {
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 10mm;
    align-items: start;
  }
  .operator-signoff__lead {
    display: grid;
    gap: 12px;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 10mm 0 0;
  }
  .metric {
    padding: 10px 12px;
    border: 1px solid rgba(17, 24, 39, 0.12);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.78);
  }
  .metric--dark {
    border-color: rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.05);
  }
  .metric__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.6;
  }
  .metric__value {
    margin-top: 8px;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 14mm;
  }
  .three-col {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .stack { display: grid; gap: 14px; }
  .stack--tight { display: grid; gap: 8px; }
  .panel {
    border: 1px solid rgba(17, 24, 39, 0.10);
    border-radius: 16px;
    padding: 14px;
    background: rgba(255,255,255,0.94);
  }
  .panel--muted { background: #f4efe4; }
  .panel--dark {
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
  }
  .panel__title {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.6;
  }
  .lead {
    font-size: 19px;
    line-height: 1.5;
    letter-spacing: -0.02em;
  }
  .lede-serif {
    font-family: "Noto Serif", Georgia, "Times New Roman", serif;
    font-size: 20px;
    line-height: 1.6;
  }
  .body-copy {
    font-size: 12px;
    line-height: 1.7;
    color: rgba(17, 24, 39, 0.78);
  }
  .page--dark .body-copy { color: rgba(248, 250, 252, 0.76); }

  .day-hero {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 12mm;
    margin-bottom: 10mm;
    align-items: end;
  }
  .day-hero__image {
    width: 100%;
    height: 82mm;
    object-fit: cover;
    border-radius: 20px;
  }
  .day-hero__eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.52;
  }
  .day-hero__title {
    margin: 8px 0 8px;
    font-size: 28px;
    line-height: 1.08;
    letter-spacing: -0.04em;
    font-weight: 700;
  }
  .day-hero__date {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.56;
  }

  .activity-list {
    display: grid;
    gap: 9px;
  }
  .activity-card {
    display: grid;
    grid-template-columns: 42mm 1fr;
    gap: 10px;
    align-items: stretch;
    border: 1px solid rgba(17, 24, 39, 0.10);
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255,255,255,0.98);
  }
  .activity-card--text {
    grid-template-columns: 1fr;
  }
  .activity-card--compact {
    grid-template-columns: 1fr;
    gap: 0;
    align-self: start;
  }
  .activity-card--dark {
    border-color: rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.05);
  }
  .activity-card__media {
    width: 100%;
    height: 100%;
    min-height: 40mm;
    object-fit: cover;
    background: rgba(17,24,39,0.06);
  }
  .activity-card--compact .activity-card__media {
    height: 28mm;
    min-height: 28mm;
  }
  .activity-card__body {
    padding: 11px 12px;
    min-width: 0;
  }
  .activity-card--compact .activity-card__body {
    padding: 10px 11px 11px;
  }
  .activity-card__meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 7px;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.55;
    font-weight: 700;
  }
  .activity-card--compact .activity-card__meta {
    margin-bottom: 5px;
    font-size: 8px;
  }
  .activity-card__title {
    margin: 0 0 6px;
    font-size: 16px;
    line-height: 1.2;
    letter-spacing: -0.03em;
    font-weight: 700;
  }
  .activity-card--compact .activity-card__title {
    margin-bottom: 4px;
    font-size: 14px;
    line-height: 1.18;
  }
  .activity-card__desc {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.56;
    color: rgba(17, 24, 39, 0.74);
  }
  .activity-card--compact .activity-card__desc {
    font-size: 10.5px;
    line-height: 1.48;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .page--dark .activity-card__desc { color: rgba(248,250,252,0.72); }
  .activity-card__footer {
    display: flex;
    gap: 10px;
    margin-top: 8px;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.56;
  }

  .safari-overview {
    display: grid;
    grid-template-columns: 1.06fr 0.94fr;
    gap: 12mm;
    align-items: start;
  }
  .safari-overview__lead {
    display: grid;
    gap: 8mm;
  }
  .safari-overview__hero {
    width: 100%;
    height: 100mm;
    object-fit: cover;
    border-radius: 20px;
    display: block;
  }
  .safari-overview__stack {
    display: grid;
    gap: 8px;
  }
  .safari-overview__panel {
    border-top: 1px solid rgba(24, 24, 27, 0.10);
    padding-top: 10px;
  }
  .safari-overview__panel:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .safari-overview__meta {
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.55;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .safari-overview__title {
    margin: 0 0 5px;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .safari-overview__copy {
    margin: 0;
    font-size: 11px;
    line-height: 1.6;
    color: rgba(17, 24, 39, 0.76);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .safari-day {
    display: grid;
    gap: 9mm;
  }
  .safari-day__head {
    display: grid;
    grid-template-columns: 1.02fr 0.98fr;
    gap: 10mm;
    align-items: end;
  }
  .safari-day__hero {
    width: 100%;
    height: 78mm;
    object-fit: cover;
    border-radius: 18px;
    display: block;
  }
  .safari-day__eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.52;
  }
  .safari-day__title {
    margin: 8px 0 8px;
    font-size: 29px;
    line-height: 1.04;
    letter-spacing: -0.04em;
    font-weight: 700;
    font-family: "Noto Serif", Georgia, "Times New Roman", serif;
  }
  .safari-day__summary {
    margin: 12px 0 0;
    font-size: 12px;
    line-height: 1.7;
    color: rgba(17,24,39,0.74);
  }
  .safari-feature {
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    gap: 10px;
    border: 1px solid rgba(17, 24, 39, 0.10);
    border-radius: 18px;
    overflow: hidden;
    background: rgba(255,255,255,0.98);
  }
  .safari-feature__image {
    width: 100%;
    height: 100%;
    min-height: 64mm;
    object-fit: cover;
    display: block;
    background: rgba(17,24,39,0.06);
  }
  .safari-feature__body {
    padding: 14px 15px;
    display: grid;
    gap: 6px;
    align-content: start;
  }
  .safari-feature__title {
    margin: 0;
    font-size: 22px;
    line-height: 1.12;
    letter-spacing: -0.03em;
    font-weight: 700;
  }
  .safari-support-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    align-items: start;
  }
  .safari-note {
    display: grid;
    grid-template-columns: 34mm 1fr;
    gap: 10px;
    border-top: 1px solid rgba(17,24,39,0.10);
    padding-top: 9px;
  }
  .safari-note:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .safari-note__image {
    width: 100%;
    height: 28mm;
    object-fit: cover;
    border-radius: 10px;
    display: block;
    background: rgba(17,24,39,0.06);
  }
  .safari-note__title {
    margin: 0 0 4px;
    font-size: 13px;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .safari-note__desc {
    margin: 0;
    font-size: 10.5px;
    line-height: 1.55;
    color: rgba(17,24,39,0.74);
  }
  .safari-continuation {
    display: grid;
    gap: 8mm;
  }

  .mosaic {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: 32mm;
    gap: 6px;
    margin-top: 8mm;
  }
  .mosaic__tile,
  .bento__tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .mosaic__cell {
    overflow: hidden;
    border-radius: 14px;
  }
  .mosaic__cell--a { grid-column: span 3; grid-row: span 2; }
  .mosaic__cell--b { grid-column: span 3; }
  .mosaic__cell--c { grid-column: span 2; }
  .mosaic__cell--d { grid-column: span 2; }
  .mosaic__cell--e { grid-column: span 2; }

  .brief-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 12mm;
    align-items: start;
  }
  .brief-table {
    width: 100%;
    border-collapse: collapse;
  }
  .brief-table th,
  .brief-table td {
    padding: 9px 10px;
    border-bottom: 1px solid rgba(17,24,39,0.10);
    font-size: 11px;
    vertical-align: top;
    text-align: left;
  }
  .brief-table th {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(17,24,39,0.5);
  }

  .summary-shell {
    display: grid;
    gap: 10mm;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 10mm;
    align-items: start;
  }
  .summary-intro {
    display: grid;
    gap: 8mm;
  }
  .summary-sidebar {
    display: grid;
    gap: 8px;
  }
  .summary-image {
    width: 100%;
    height: 78mm;
    object-fit: cover;
    border-radius: 18px;
    display: block;
  }
  .summary-highlights {
    display: grid;
    gap: 8px;
  }
  .summary-highlight {
    display: grid;
    grid-template-columns: 24px 1fr;
    gap: 10px;
    align-items: start;
    padding: 10px 0;
    border-top: 1px solid rgba(17,24,39,0.08);
  }
  .summary-highlight:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .summary-highlight__index {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    border: 1px solid rgba(17,24,39,0.14);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .summary-highlight__title {
    margin: 0 0 4px;
    font-size: 13px;
    line-height: 1.3;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .summary-highlight__meta {
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.55;
    margin-bottom: 4px;
  }
  .summary-highlight__desc {
    margin: 0;
    font-size: 11px;
    line-height: 1.55;
    color: rgba(17,24,39,0.72);
  }
  .summary-highlights--paged {
    margin-top: 9mm;
  }
  .summary-highlights--paged .summary-highlight {
    padding: 9px 0;
  }
  .summary-highlights--paged .summary-highlight__desc {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .summary-band {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .summary-band__card {
    border: 1px solid rgba(17,24,39,0.08);
    border-radius: 18px;
    padding: 14px 14px 13px;
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,246,239,0.92));
  }
  .summary-band__label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.55;
  }
  .summary-band__value {
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.18;
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  .summary-band__copy {
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.45;
    color: rgba(17,24,39,0.72);
  }
  .page--dark .summary-band__card {
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
  }
  .page--dark .summary-highlight {
    border-top-color: rgba(255,255,255,0.12);
  }
  .page--dark .summary-highlight__index {
    border-color: rgba(255,255,255,0.18);
  }
  .page--dark .summary-highlight__desc,
  .page--dark .summary-band__copy {
    color: rgba(248,250,252,0.72);
  }
  .summary-band--featured {
    grid-template-columns: 1.05fr 0.95fr 1fr;
  }
  .summary-band--numbers {
    gap: 10px;
  }
  .summary-band__card--number {
    min-height: 108px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    border: none;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(17,24,39,0.07);
  }
  .summary-band__accent-bar {
    height: 4px;
    flex-shrink: 0;
  }
  .summary-band__card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 11px 14px 12px;
  }
  .summary-band__number {
    font-size: 40px;
    line-height: 0.95;
    letter-spacing: -0.05em;
    font-weight: 800;
  }
  .summary-band__rule {
    height: 1px;
    background: rgba(17,24,39,0.08);
    margin: 3px 0 1px;
  }
  .summary-band__unit {
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(17,24,39,0.40);
    font-weight: 700;
  }
  .summary-band__value--price {
    font-size: 24px;
    line-height: 1.08;
  }

  .bento {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }
  .bento__tile {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(15,23,42,0.08);
    background: #ffffff;
    min-height: 38mm;
  }
  .bento__tile--hero { grid-column: span 3; grid-row: span 2; }
  .bento__tile--wide { grid-column: span 3; }
  .bento__tile--stats { grid-column: span 2; padding: 12px; }
  .bento__tile--copy { grid-column: span 3; padding: 14px; }
  .bento__tile--mini { grid-column: span 2; padding: 12px; }
  .bento-day-shell {
    display: grid;
    gap: 10mm;
  }
  .bento-day-top {
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    gap: 10mm;
    align-items: stretch;
  }
  .bento-day-hero {
    width: 100%;
    height: 108mm;
    object-fit: cover;
    border-radius: 18px;
    display: block;
  }
  .bento-rail {
    display: grid;
    gap: 8px;
  }
  .bento-panel {
    border: 1px solid rgba(17,24,39,0.10);
    border-radius: 16px;
    background: rgba(255,255,255,0.98);
    overflow: hidden;
  }
  .bento-panel__body {
    padding: 12px 13px;
  }
  .bento-panel__image {
    width: 100%;
    height: 40mm;
    object-fit: cover;
    display: block;
    background: rgba(17,24,39,0.06);
  }
  .bento-panel__title {
    margin: 0 0 5px;
    font-size: 14px;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .bento-panel__desc {
    margin: 0;
    font-size: 10.5px;
    line-height: 1.5;
    color: rgba(17,24,39,0.74);
  }
  .bento-panel__meta {
    font-size: 8.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.56;
    margin-bottom: 6px;
    font-weight: 700;
  }
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .bento-summary-card {
    display: grid;
    gap: 8px;
  }
  .bento-summary-card .lead {
    font-size: 17px;
    line-height: 1.45;
  }
  .bento-day-meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .dense .activity-card {
    grid-template-columns: 32mm 1fr;
  }
  .dense .activity-card__media {
    min-height: 28mm;
  }
  .dense .day-hero__image {
    height: 62mm;
  }
  .dense .cover__title {
    font-size: 30px;
  }
  .immersive .cover__title {
    font-size: 38px;
  }
  .immersive .activity-card__title {
    font-size: 18px;
  }

  .closing-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 10mm;
  }
  .list-clean {
    margin: 0;
    padding-left: 16px;
    font-size: 12px;
    line-height: 1.7;
  }
  .list-clean li + li { margin-top: 4px; }

  .accent-line {
    width: 72px;
    height: 3px;
    border-radius: 999px;
    margin: 0 0 10px;
  }
`;

const formatDateLabel = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatShortDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (itinerary: PreparedPrintPayload['itinerary']) => {
  const currency = itinerary.extracted_pricing?.currency || 'INR';
  const total =
    itinerary.extracted_pricing?.total_cost ||
    itinerary.pricing?.basePrice ||
    itinerary.extracted_pricing?.per_person_cost ||
    null;

  if (!total) return null;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(total);
};

const getFeaturedActivities = (payload: PreparedPrintPayload, limit = 4) =>
  payload.itinerary.days
    .slice(0, limit)
    .map((day) => {
      const first = day.activities[0];
      if (!first) return null;
      return {
        ...first,
        dayNumber: day.day_number,
        dayTheme: day.theme,
      };
    })
    .filter((activity): activity is NonNullable<typeof activity> => activity !== null && Boolean(activity.title));

const getTopLocations = (payload: PreparedPrintPayload, limit = 3) => {
  const values = payload.itinerary.days
    .flatMap((day) => day.activities.map((activity) => activity.location).filter(Boolean) as string[])
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(values)].slice(0, limit);
};

const chunkItems = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const resolveAccentColor = (payload: PreparedPrintPayload) => payload.branding.primaryColor || '#9a6c2f';

const formatStandaloneCurrency = (value?: number | null, currency = 'INR') => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return null;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(value);
};

const getItineraryCurrency = (payload: PreparedPrintPayload) =>
  payload.itinerary.extracted_pricing?.currency || 'INR';

const getDayLocations = (
  day: PreparedPrintPayload['itinerary']['days'][number],
  limit = 4,
) => {
  const values = day.activities
    .map((activity) => activity.location?.trim())
    .filter((value): value is string => Boolean(value));

  return [...new Set(values)].slice(0, limit);
};

const getDayAccommodation = (payload: PreparedPrintPayload, dayNumber: number) =>
  payload.printExtras.dayAccommodations.find((accommodation) => accommodation.dayNumber === dayNumber) || null;

const getSelectedAddOns = (payload: PreparedPrintPayload, limit = 4) =>
  payload.printExtras.selectedAddOns.slice(0, limit);

const getTravelWindowLabel = (payload: PreparedPrintPayload) => {
  if (payload.itinerary.start_date && payload.itinerary.end_date) {
    return `${formatDateLabel(payload.itinerary.start_date)} – ${formatDateLabel(payload.itinerary.end_date)}`;
  }
  return formatDateLabel(payload.itinerary.start_date) || 'Dates to be confirmed';
};

const LocationRibbon = ({
  locations,
  accent,
}: {
  locations: string[];
  accent: string;
}) => {
  if (!locations.length) return null;

  return (
    <div className="location-ribbon">
      {locations.map((location, index) => (
        <React.Fragment key={`${location}-${index}`}>
          <div className="location-ribbon__stop">
            <span className="location-ribbon__dot" style={{ background: accent }} />
            <span className="location-ribbon__name">{location}</span>
          </div>
          {index < locations.length - 1 ? <span className="location-ribbon__line" /> : null}
        </React.Fragment>
      ))}
    </div>
  );
};

const StayPanel = ({
  accommodation,
  compact = false,
}: {
  accommodation: PreparedPrintAccommodation | null;
  compact?: boolean;
}) => {
  if (!accommodation) return null;

  const amenityLine = accommodation.amenities?.slice(0, 3).join(' • ');
  const starLine = accommodation.starRating ? `${accommodation.starRating}-star stay` : null;

  return (
    <div className={`sidebar-panel ${compact ? 'sidebar-panel--compact' : ''}`}>
      <p className="sidebar-panel__title">Stay Tonight</p>
      <div className={`stay-card ${compact ? 'stay-card--compact' : ''}`}>
        {accommodation.printImage ? (
          <img
            className="stay-card__image"
            src={accommodation.printImage}
            alt={accommodation.hotelName}
          />
        ) : null}
        <div>
          <h3 className="stay-card__title">{accommodation.hotelName}</h3>
          {(accommodation.roomType || starLine) ? (
            <p className="body-copy" style={{ margin: '6px 0 0' }}>
              {[accommodation.roomType, starLine].filter(Boolean).join(' • ')}
            </p>
          ) : null}
          {amenityLine ? (
            <p className="body-copy" style={{ margin: '8px 0 0', fontSize: 10.5 }}>
              {amenityLine}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const MiniListPanel = ({
  title,
  items,
  compact = false,
  maxItems,
}: {
  title: string;
  items: string[];
  compact?: boolean;
  maxItems?: number;
}) => {
  const visibleItems = typeof maxItems === 'number' ? items.slice(0, maxItems) : items;
  if (!visibleItems.length) return null;

  return (
    <div className={`sidebar-panel ${compact ? 'sidebar-panel--compact' : ''}`}>
      <p className="sidebar-panel__title">{title}</p>
      <div className="mini-list">
        {visibleItems.map((item, index) => (
          <div key={`${title}-${index}`} className="mini-list__item">
            <div className="mini-list__index">{index + 1}</div>
            <div className={`body-copy ${compact ? 'mini-list__text--compact' : ''}`} style={{ margin: 0 }}>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddOnPanel = ({
  addOns,
  payload,
}: {
  addOns: PreparedPrintAddOn[];
  payload: PreparedPrintPayload;
}) => {
  if (!addOns.length) return null;

  return (
    <div className="sidebar-panel">
      <p className="sidebar-panel__title">Available Upgrades</p>
      <div className="addon-grid">
        {addOns.map((addOn, index) => (
          <div key={`${addOn.name}-${index}`} className="addon-card">
            {addOn.printImage ? <img className="addon-card__image" src={addOn.printImage} alt={addOn.name} /> : null}
            <div className="addon-card__body">
              <div className="activity-card__meta" style={{ marginBottom: 5 }}>
                {addOn.category ? <span>{addOn.category}</span> : null}
                {addOn.quantity && addOn.quantity > 1 ? <span>x{addOn.quantity}</span> : null}
              </div>
              <h3 className="addon-card__title">{addOn.name}</h3>
              {addOn.description ? (
                <p className="body-copy" style={{ margin: '5px 0 0', fontSize: 10.5 }}>
                  {addOn.description}
                </p>
              ) : null}
              {addOn.unitPrice ? (
                <div className="body-copy" style={{ marginTop: 6, fontWeight: 700, color: 'rgba(17,24,39,0.78)' }}>
                  {formatStandaloneCurrency(addOn.unitPrice, getItineraryCurrency(payload))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DayDossier = ({
  payload,
  day,
}: {
  payload: PreparedPrintPayload;
  day: PreparedPrintPayload['itinerary']['days'][number];
}) => {
  const accommodation = getDayAccommodation(payload, day.day_number);
  const locations = getDayLocations(day, 3);
  const logisticsLine = [
    payload.itinerary.logistics?.flights?.length ? `${payload.itinerary.logistics.flights.length} flight${payload.itinerary.logistics.flights.length > 1 ? 's' : ''}` : null,
    payload.itinerary.logistics?.hotels?.length ? `${payload.itinerary.logistics.hotels.length} stay${payload.itinerary.logistics.hotels.length > 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' • ');

  return (
    <div className="day-dossier">
      <div className="day-dossier__card">
        <div className="trip-brief__label">Route sequence</div>
        <div className="day-dossier__value">{locations[0] || day.theme}</div>
        <div className="trip-brief__copy">{locations.slice(1).join(' • ') || 'Operator-curated day flow.'}</div>
      </div>
      <div className="day-dossier__card">
        <div className="trip-brief__label">Stay tonight</div>
        <div className="day-dossier__value">{accommodation?.hotelName || 'Operator to confirm'}</div>
        <div className="trip-brief__copy">{accommodation?.roomType || 'Accommodation details slot into the dossier when assigned.'}</div>
      </div>
      <div className="day-dossier__card">
        <div className="trip-brief__label">Operational pulse</div>
        <div className="day-dossier__value">{day.activities.length} planned moments</div>
        <div className="trip-brief__copy">{logisticsLine || 'Built to keep the day moving cleanly between stops.'}</div>
      </div>
    </div>
  );
};

const BrandRow = ({
  branding,
  dark = false,
  showContact = false,
}: {
  branding: PreparedPrintPayload['branding'];
  dark?: boolean;
  showContact?: boolean;
}) => (
  <div className="brand-row">
    <div className="brand-mark">
      {branding.logoDataUrl ? <img className="brand-logo" src={branding.logoDataUrl} alt={branding.companyName} /> : null}
      <div className="brand-meta">
        <div className="brand-name">{branding.companyName}</div>
        {showContact && (branding.contactEmail || branding.contactPhone) ? (
          <div className="brand-contact">
            {[branding.contactEmail, branding.contactPhone].filter(Boolean).join('  •  ')}
          </div>
        ) : null}
      </div>
    </div>
    <div className="brand-badge" style={dark ? { color: 'rgba(248,250,252,0.78)' } : undefined}>
      {branding.clientName ? `Prepared for ${branding.clientName}` : 'Client itinerary'}
    </div>
  </div>
);

const Metrics = ({
  payload,
  dark = false,
}: {
  payload: PreparedPrintPayload;
  dark?: boolean;
}) => {
  const price = formatCurrency(payload.itinerary);
  const totalActivities = payload.itinerary.days.reduce((sum, day) => sum + day.activities.length, 0);
  return (
    <div className="metrics">
      <div className={`metric ${dark ? 'metric--dark' : ''}`}>
        <div className="metric__label">Duration</div>
        <div className="metric__value">{payload.itinerary.duration_days || payload.itinerary.days.length} Days</div>
      </div>
      <div className={`metric ${dark ? 'metric--dark' : ''}`}>
        <div className="metric__label">Stops</div>
        <div className="metric__value">{totalActivities}</div>
      </div>
      <div className={`metric ${dark ? 'metric--dark' : ''}`}>
        <div className="metric__label">Estimated Value</div>
        <div className="metric__value">{price || 'Custom Quote'}</div>
      </div>
    </div>
  );
};

const ActivityCard = ({
  activity,
  dark = false,
  compact = false,
}: {
  activity: PreparedPrintActivity;
  dark?: boolean;
  compact?: boolean;
}) => {
  const hasImage = Boolean(activity.printImage);
  return (
    <article className={`activity-card ${!hasImage ? 'activity-card--text' : ''} ${compact ? 'activity-card--compact' : ''} ${dark ? 'activity-card--dark' : ''}`}>
      {hasImage ? <img className="activity-card__media" src={activity.printImage!} alt={activity.title} /> : null}
      <div className="activity-card__body">
        <div className="activity-card__meta">
          {activity.time ? <span>{activity.time}</span> : null}
          {activity.location ? <span>{activity.location}</span> : null}
        </div>
        <h3 className="activity-card__title">{activity.title}</h3>
        <p className="activity-card__desc">{activity.description}</p>
        {activity.duration ? (
          <div className="activity-card__footer">
            <span>{activity.duration}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
};

const PackagePanels = ({ payload, dark = false }: { payload: PreparedPrintPayload; dark?: boolean }) => {
  const hasInclusions = Boolean(payload.itinerary.inclusions?.length);
  const hasExclusions = Boolean(payload.itinerary.exclusions?.length);
  const hasTips = Boolean(payload.itinerary.tips?.length);
  if (!hasInclusions && !hasExclusions && !hasTips) return null;

  return (
    <div className="closing-grid">
      {hasInclusions ? (
        <div className={`panel ${dark ? 'panel--dark' : ''}`}>
          <p className="panel__title">Included</p>
          <ul className="list-clean">
            {payload.itinerary.inclusions!.map((item, index) => <li key={`inc-${index}`}>{item}</li>)}
          </ul>
        </div>
      ) : null}
      {hasExclusions ? (
        <div className={`panel ${dark ? 'panel--dark' : ''}`}>
          <p className="panel__title">Arrange Separately</p>
          <ul className="list-clean">
            {payload.itinerary.exclusions!.map((item, index) => <li key={`exc-${index}`}>{item}</li>)}
          </ul>
        </div>
      ) : null}
      {hasTips ? (
        <div className={`panel ${dark ? 'panel--dark' : ''}`} style={{ gridColumn: hasInclusions || hasExclusions ? '1 / -1' : undefined }}>
          <p className="panel__title">Travel Notes</p>
          <ul className="list-clean">
            {payload.itinerary.tips!.map((item, index) => <li key={`tip-${index}`}>{item}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const LogisticsPanel = ({ payload, dark = false }: { payload: PreparedPrintPayload; dark?: boolean }) => {
  const flights = payload.itinerary.logistics?.flights || [];
  const hotels = payload.itinerary.logistics?.hotels || [];
  if (!flights.length && !hotels.length) return null;
  return (
    <div className="two-col">
      <div className={`panel ${dark ? 'panel--dark' : ''}`}>
        <p className="panel__title">Travel Logistics</p>
        {flights.length ? (
          <div className="stack--tight">
            {flights.map((flight) => (
              <div key={flight.id} className="panel" style={{ padding: 12, background: dark ? 'rgba(255,255,255,0.04)' : '#fff' }}>
                <div style={{ fontWeight: 700 }}>{flight.airline} <span style={{ opacity: 0.55, fontWeight: 500 }}>{flight.flight_number}</span></div>
                <div className="body-copy" style={{ marginTop: 6 }}>
                  {flight.departure_airport} {flight.departure_time ? `• ${flight.departure_time}` : ''}<br />
                  {flight.arrival_airport} {flight.arrival_time ? `• ${flight.arrival_time}` : ''}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="body-copy">Flight details can be added before final dispatch.</p>}
      </div>
      <div className={`panel ${dark ? 'panel--dark' : ''}`}>
        <p className="panel__title">Stays</p>
        {hotels.length ? (
          <div className="stack--tight">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="panel" style={{ padding: 12, background: dark ? 'rgba(255,255,255,0.04)' : '#fff' }}>
                <div style={{ fontWeight: 700 }}>{hotel.name}</div>
                <div className="body-copy" style={{ marginTop: 6 }}>
                  {hotel.address}<br />
                  {hotel.check_in} to {hotel.check_out}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="body-copy">Accommodation details can be added before final dispatch.</p>}
      </div>
    </div>
  );
};

const PageFooter = ({ branding }: { branding: PreparedPrintPayload['branding'] }) => {
  const contactBits = [branding.companyName, branding.contactEmail, branding.contactPhone].filter(Boolean);
  return (
    <div className="page__footer">
      <span>{contactBits.join('  •  ')}</span>
      <span>Powered by TripBuilt • <span className="page__number" /></span>
    </div>
  );
};

const SummaryPage = ({
  payload,
  dark = false,
  title,
  leadClassName = 'lead',
}: {
  payload: PreparedPrintPayload;
  dark?: boolean;
  title: string;
  leadClassName?: string;
}) => {
  const featuredActivities = getFeaturedActivities(payload, 4);
  const topLocations = getTopLocations(payload, 3);
  const price = formatCurrency(payload.itinerary);

  return (
    <section className={`page ${dark ? 'page--dark' : 'page--white'}`}>
      <div className="page__inner">
        <BrandRow branding={payload.branding} dark={dark} />
        <div className="summary-shell">
          <div className="summary-grid">
            <div className="summary-intro">
              <div>
                <div className="accent-line" style={{ background: payload.branding.primaryColor || '#1d4ed8' }} />
                <p className="section-kicker">Overview</p>
                <h2 style={{ fontSize: 30, lineHeight: 1.08, letterSpacing: '-0.04em', margin: '8px 0 12px' }}>{title}</h2>
                <p className={leadClassName}>{payload.itinerary.summary}</p>
              </div>
              {payload.coverImage ? <img className="summary-image" src={payload.coverImage} alt={payload.itinerary.trip_title} /> : null}
              <div className="summary-band">
                <div className="summary-band__card">
                  <div className="summary-band__label">Trip rhythm</div>
                  <div className="summary-band__value">{payload.density === 'immersive' ? 'Slow + spacious' : payload.density === 'balanced' ? 'Balanced pacing' : 'Packed schedule'}</div>
                  <div className="summary-band__copy">Structured for {payload.itinerary.duration_days} days with {payload.itinerary.days.length} day chapters.</div>
                </div>
                <div className="summary-band__card">
                  <div className="summary-band__label">Destination spread</div>
                  <div className="summary-band__value">{topLocations[0] || payload.itinerary.destination}</div>
                  <div className="summary-band__copy">{topLocations.slice(1).join(' • ') || 'Core destination-led plan'}</div>
                </div>
                <div className="summary-band__card">
                  <div className="summary-band__label">Value posture</div>
                  <div className="summary-band__value">{price || 'Custom quote'}</div>
                  <div className="summary-band__copy">Client-facing estimate presented with print-safe, lighter image density.</div>
                </div>
              </div>
            </div>
            <div className="summary-sidebar">
              <Metrics payload={payload} dark={dark} />
              <div className={`panel ${dark ? 'panel--dark' : ''}`}>
                <p className="panel__title">Featured stops</p>
                <div className="summary-highlights">
                  {featuredActivities.slice(0, 3).map((activity, index) => (
                    <div key={`featured-${index}`} className="summary-highlight">
                      <div className="summary-highlight__index">{activity.dayNumber}</div>
                      <div>
                        <div className="summary-highlight__meta">Day {activity.dayNumber} • {activity.location || activity.dayTheme}</div>
                        <h3 className="summary-highlight__title">{activity.title}</h3>
                        <p className="summary-highlight__desc">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`panel ${dark ? 'panel--dark' : ''}`}>
                <p className="panel__title">Print treatment</p>
                <div className="body-copy">
                  Hero images are prioritized, repeated visuals are reduced, and the day sequence is restructured for a brochure rhythm instead of a web snapshot.
                </div>
              </div>
            </div>
          </div>
          <div>
            <LogisticsPanel payload={payload} dark={dark} />
          </div>
        </div>
        <PageFooter branding={payload.branding} />
      </div>
    </section>
  );
};

const SafariHighlightsPage = ({
  payload,
  activities,
  pageIndex,
  totalPages,
  accent,
  topLocations,
  selectedAddOns,
}: {
  payload: PreparedPrintPayload;
  activities: ReturnType<typeof getFeaturedActivities>;
  pageIndex: number;
  totalPages: number;
  accent: string;
  topLocations: string[];
  selectedAddOns: PreparedPrintAddOn[];
}) => {
  const notes = (payload.itinerary.tips || payload.itinerary.inclusions || payload.itinerary.exclusions || [])
    .slice(pageIndex * 3, pageIndex * 3 + 3);
  const upgradeItems = selectedAddOns
    .map((addOn) => [addOn.name, addOn.category, addOn.unitPrice ? formatStandaloneCurrency(addOn.unitPrice, getItineraryCurrency(payload)) : null].filter(Boolean).join(' • '))
    .slice(0, 3);

  return (
    <section className="page page--light">
      <div className="page__inner">
        <BrandRow branding={payload.branding} />
        <div className="summary-grid">
          <div>
            <div className="accent-line" style={{ background: accent }} />
            <p className="section-kicker">
              Trip Brief {totalPages > 1 ? `Continuation ${pageIndex + 1}` : 'Continuation'}
            </p>
            <h2 style={{ fontSize: 30, lineHeight: 1.06, letterSpacing: '-0.04em', margin: '8px 0 0', fontFamily: '"Noto Serif", Georgia, Times New Roman, serif' }}>
              Additional highlights for the client handoff
            </h2>
            <div className="summary-highlights summary-highlights--paged">
              {activities.map((activity, index) => (
                <div key={`safari-brief-extra-${pageIndex}-${index}`} className="summary-highlight">
                  <div className="summary-highlight__index">{activity.dayNumber}</div>
                  <div>
                    <div className="summary-highlight__meta">Day {activity.dayNumber} • {activity.location || activity.dayTheme}</div>
                    <h3 className="summary-highlight__title">{activity.title}</h3>
                    <p className="summary-highlight__desc">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="summary-sidebar">
            <MiniListPanel title="Route Sequence" items={topLocations} compact maxItems={5} />
            {upgradeItems.length ? (
              <MiniListPanel title="Available Upgrades" items={upgradeItems} compact maxItems={3} />
            ) : (
              <MiniListPanel title="What Shapes The Trip" items={(payload.itinerary.interests || topLocations).slice(0, 4)} compact maxItems={4} />
            )}
            <MiniListPanel title="Client Handoff Notes" items={notes.length ? notes : topLocations} compact maxItems={3} />
          </div>
        </div>
        <PageFooter branding={payload.branding} />
      </div>
    </section>
  );
};

const SafariTemplate = ({ payload }: { payload: PreparedPrintPayload }) => {
  const featuredActivities = getFeaturedActivities(payload, Math.min(payload.itinerary.days.length, 8));
  const accent = resolveAccentColor(payload);
  const price = formatCurrency(payload.itinerary);
  const topLocations = getTopLocations(payload, 5);
  const selectedAddOns = getSelectedAddOns(payload, 4);
  const totalActivities = payload.itinerary.days.reduce((sum, day) => sum + day.activities.length, 0);
  const flightsCount = payload.itinerary.logistics?.flights?.length || 0;
  const staysCount = payload.itinerary.logistics?.hotels?.length || payload.printExtras.dayAccommodations.length || 0;
  const briefHighlights = featuredActivities.slice(0, 2);
  const extraHighlightPages = chunkItems(featuredActivities.slice(2), 4);

  return (
    <>
        <section className="page page--light immersive">
          <div className="cover">
            {payload.coverImage ? <img className="cover__image" src={payload.coverImage} alt={payload.itinerary.trip_title} /> : null}
            <div className="cover__overlay" style={{ background: 'linear-gradient(180deg, rgba(47,33,10,0.08), rgba(44,32,18,0.82))' }} />
            <div className="cover__content">
              <BrandRow branding={payload.branding} dark showContact />
              <div>
                <p className="cover__kicker" style={{ color: 'rgba(255,247,237,0.78)' }}>{payload.itinerary.destination}</p>
                <h1 className="cover__title" style={{ color: '#fff7ed', fontFamily: '"Noto Serif", Georgia, Times New Roman, serif' }}>{payload.itinerary.trip_title}</h1>
                <p className="cover__subtitle" style={{ color: 'rgba(255,247,237,0.88)' }}>{payload.itinerary.summary}</p>
                {payload.branding.clientName ? (
                  <p
                    className="cover__prepared-for"
                    style={{
                      color: 'rgba(255,247,237,0.92)',
                      fontSize: 13,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      margin: '18px 0 0',
                      fontFamily: '"Noto Serif", Georgia, Times New Roman, serif',
                    }}
                  >
                    Prepared for <span style={{ fontWeight: 700 }}>{payload.branding.clientName}</span>
                  </p>
                ) : null}
                <div className="cover__meta">
                  <span className="meta-pill">{payload.itinerary.duration_days} Days</span>
                  <span className="meta-pill">{getTravelWindowLabel(payload)}</span>
                  {price ? <span className="meta-pill">{price}</span> : null}
                </div>
                <div className="cover-dossier">
                  <div className="cover-dossier__card">
                    <div className="cover-dossier__label">Destination</div>
                    <div className="cover-dossier__value">{payload.itinerary.destination}</div>
                  </div>
                  <div className="cover-dossier__card">
                    <div className="cover-dossier__label">Prepared by</div>
                    <div className="cover-dossier__value">{payload.branding.companyName}</div>
                  </div>
                  <div className="cover-dossier__card">
                    <div className="cover-dossier__label">Travel window</div>
                    <div className="cover-dossier__value cover-dossier__value--small">{getTravelWindowLabel(payload)}</div>
                  </div>
                  <div className="cover-dossier__card">
                    <div className="cover-dossier__label">Trip posture</div>
                    <div className="cover-dossier__value">{price || `${totalActivities} planned moments`}</div>
                  </div>
                </div>
              </div>
              <PageFooter branding={payload.branding} />
            </div>
          </div>
        </section>
        <section className="page page--light">
          <div className="page__inner">
            <BrandRow branding={payload.branding} />
            <div className="trip-brief">
              <div className="trip-brief__lead">
                <div className="trip-brief__headline">
                  <div>
                    <div className="accent-line" style={{ background: accent }} />
                    <p className="section-kicker">Trip Brief</p>
                    <h2 style={{ fontSize: 34, lineHeight: 1.02, letterSpacing: '-0.05em', margin: '8px 0 12px', fontFamily: '"Noto Serif", Georgia, Times New Roman, serif' }}>
                      Designed for a client-ready handoff
                    </h2>
                    <p className="lede-serif" style={{ margin: 0 }}>{payload.itinerary.summary}</p>
                  </div>
                  <LocationRibbon locations={topLocations} accent={accent} />
                </div>
                {payload.coverImage ? <img className="safari-overview__hero" src={payload.coverImage} alt={payload.itinerary.trip_title} /> : null}
                <div className="trip-brief__cards">
                  <div className="trip-brief__card">
                    <div className="trip-brief__label">Duration</div>
                    <div className="trip-brief__value" style={{ color: accent }}>{payload.itinerary.duration_days} days</div>
                    <div className="trip-brief__copy">{payload.itinerary.days.length} day chapters shaped into one printable narrative.</div>
                  </div>
                  <div className="trip-brief__card">
                    <div className="trip-brief__label">Trip rhythm</div>
                    <div className="trip-brief__value">
                      {payload.density === 'immersive' ? 'Slow + spacious' : payload.density === 'dense' ? 'Dense + eventful' : 'Balanced pacing'}
                    </div>
                    <div className="trip-brief__copy">Built around {totalActivities} planned moments with space for client-facing polish.</div>
                  </div>
                  <div className="trip-brief__card">
                    <div className="trip-brief__label">Travel window</div>
                    <div className="trip-brief__value">{getTravelWindowLabel(payload)}</div>
                    <div className="trip-brief__copy">Presented in a simple dossier band so operators can send it directly.</div>
                  </div>
                  <div className="trip-brief__card">
                    <div className="trip-brief__label">Operations snapshot</div>
                    <div className="trip-brief__value">{[flightsCount ? `${flightsCount} flights` : null, staysCount ? `${staysCount} stays` : null].filter(Boolean).join(' • ') || 'Ground plan only'}</div>
                    <div className="trip-brief__copy">{price || 'Pricing can remain flexible while the itinerary stays presentation-ready.'}</div>
                  </div>
                </div>
              </div>
              <div className="trip-brief__sidebar">
                <div className="operator-card">
                  <div className="operator-card__name">{payload.branding.companyName}</div>
                  <p className="operator-card__copy">
                    {payload.branding.clientName
                      ? `Prepared for ${payload.branding.clientName}. This version is structured for direct client delivery with branding, logistics, and key experiences all in one print sequence.`
                      : 'Built as a ready-to-send client-facing itinerary, with operator branding leading every page.'}
                  </p>
                  {(payload.branding.contactEmail || payload.branding.contactPhone) ? (
                    <div className="body-copy" style={{ marginTop: 10 }}>
                      {[payload.branding.contactEmail, payload.branding.contactPhone].filter(Boolean).join('  •  ')}
                    </div>
                  ) : null}
                </div>
                <div className="panel panel--muted">
                  <p className="panel__title">Standout moments</p>
                  {briefHighlights.map((activity, index) => (
                    <div key={`safari-featured-${index}`} className="safari-overview__panel">
                      <div className="safari-overview__meta">Day {activity.dayNumber} • {activity.location || activity.dayTheme}</div>
                      <h3 className="safari-overview__title">{activity.title}</h3>
                      <p className="safari-overview__copy">{activity.description}</p>
                    </div>
                  ))}
                </div>
                {selectedAddOns.length ? (
                  <MiniListPanel
                    title="Available upgrades"
                    items={selectedAddOns.map((addOn) => [addOn.name, addOn.category].filter(Boolean).join(' • '))}
                    compact
                    maxItems={3}
                  />
                ) : (
                  <MiniListPanel
                    title="What shapes the trip"
                    items={(payload.itinerary.interests?.slice(0, 4) || payload.itinerary.tips?.slice(0, 4) || topLocations.slice(0, 4))}
                    compact
                    maxItems={4}
                  />
                )}
              </div>
            </div>
            <PageFooter branding={payload.branding} />
          </div>
        </section>
        {extraHighlightPages.map((activities, index) => (
          <SafariHighlightsPage
            key={`safari-brief-extra-${index}`}
            payload={payload}
            activities={activities}
            pageIndex={index}
            totalPages={extraHighlightPages.length}
            accent={accent}
            topLocations={topLocations}
            selectedAddOns={selectedAddOns}
          />
        ))}
        {payload.itinerary.days.flatMap((day, index) => {
          const [featured, ...remaining] = day.activities;
          const supportActivities = remaining.slice(0, 2);
          const continuationChunks = chunkItems(remaining.slice(2), 2);
          const dayLocations = getDayLocations(day, 4);
          const accommodation = getDayAccommodation(payload, day.day_number);
          const tripNotes = (payload.itinerary.tips || payload.itinerary.inclusions || []).slice(0, 3);

          const pages: React.ReactElement[] = [
            <section key={`safari-day-${index}`} className={`page page--light ${payload.density}`}>
              <div className="page__inner">
                <div className="safari-day">
                  <div className="safari-day__head">
                    <div>
                      <div className="accent-line" style={{ background: accent }} />
                      <p className="safari-day__eyebrow">Day {day.day_number}</p>
                      <h2 className="safari-day__title">{day.theme}</h2>
                      <div className="day-hero__date">{formatDateLabel(day.date) || payload.itinerary.destination}</div>
                      {day.summary ? <p className="safari-day__summary">{day.summary}</p> : null}
                      <div style={{ marginTop: 12 }}>
                        <LocationRibbon locations={dayLocations} accent={accent} />
                      </div>
                    </div>
                    {day.dayHeroImage ? <img className="safari-day__hero" src={day.dayHeroImage} alt={day.theme} /> : <div className="panel panel--muted" style={{ minHeight: '78mm' }} />}
                  </div>
                  {featured ? (
                    <div className="safari-feature">
                      {featured.printImage ? <img className="safari-feature__image" src={featured.printImage} alt={featured.title} /> : null}
                      <div className="safari-feature__body">
                        <div className="activity-card__meta">
                          {featured.time ? <span>{featured.time}</span> : null}
                          {featured.location ? <span>{featured.location}</span> : null}
                        </div>
                        <h3 className="safari-feature__title">{featured.title}</h3>
                        <p className="body-copy" style={{ margin: 0 }}>{featured.description}</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="continuation-layout">
                    <div className="continuation-main">
                      {supportActivities.length ? (
                        <div className="safari-support-grid">
                          {supportActivities.map((activity, activityIndex) => (
                            <ActivityCard key={`safari-support-${activityIndex}`} activity={activity} compact />
                          ))}
                        </div>
                      ) : (
                        <div className="panel panel--muted">
                          <p className="panel__title">Day note</p>
                          <p className="body-copy" style={{ margin: 0 }}>
                            {day.summary || 'This chapter stays intentionally light so the operator can keep the pacing calm and client-facing.'}
                          </p>
                        </div>
                      )}
                      <DayDossier payload={payload} day={day} />
                    </div>
                    <div className="continuation-sidebar">
                      <StayPanel accommodation={accommodation} compact />
                      <MiniListPanel title={"Today's route"} items={dayLocations} compact maxItems={3} />
                      {!accommodation && tripNotes.length ? <MiniListPanel title="Travel notes" items={tripNotes} compact maxItems={3} /> : null}
                    </div>
                  </div>
                </div>
                <PageFooter branding={payload.branding} />
              </div>
            </section>,
          ];

          continuationChunks.forEach((chunk, chunkIndex) => {
            const [continuedFeatured, ...continuedSupport] = chunk;
            const continuationNotes =
              (payload.itinerary.tips || payload.itinerary.inclusions || [])
                .slice(chunkIndex * 3, chunkIndex * 3 + 3);

            pages.push(
              <section key={`safari-day-${index}-cont-${chunkIndex}`} className={`page page--light ${payload.density}`}>
                <div className="page__inner">
                  <div className="safari-continuation">
                    <div>
                      <div className="accent-line" style={{ background: accent }} />
                      <p className="section-kicker">Day {day.day_number} continuation</p>
                      <h2 style={{ fontSize: 26, lineHeight: 1.08, letterSpacing: '-0.04em', margin: '8px 0 0', fontFamily: '"Noto Serif", Georgia, Times New Roman, serif' }}>{day.theme}</h2>
                      <div style={{ marginTop: 10 }}>
                        <LocationRibbon locations={dayLocations} accent={accent} />
                      </div>
                    </div>
                    <div className="continuation-layout">
                      <div className="continuation-main">
                        {continuedFeatured ? (
                          <div className="safari-feature">
                            {continuedFeatured.printImage ? <img className="safari-feature__image" src={continuedFeatured.printImage} alt={continuedFeatured.title} /> : null}
                            <div className="safari-feature__body">
                              <div className="activity-card__meta">
                                {continuedFeatured.time ? <span>{continuedFeatured.time}</span> : null}
                                {continuedFeatured.location ? <span>{continuedFeatured.location}</span> : null}
                              </div>
                              <h3 className="safari-feature__title">{continuedFeatured.title}</h3>
                              <p className="body-copy" style={{ margin: 0 }}>{continuedFeatured.description}</p>
                            </div>
                          </div>
                        ) : null}
                        {continuedSupport.length ? (
                          <div className="safari-support-grid">
                            {continuedSupport.map((activity, activityIndex) => (
                              <ActivityCard key={`safari-cont-support-${activityIndex}`} activity={activity} compact />
                            ))}
                          </div>
                        ) : (
                          <div className="panel panel--muted">
                            <p className="panel__title">Continuation note</p>
                            <p className="body-copy" style={{ margin: 0 }}>
                              The rest of this day is intentionally summarized here so the page keeps its editorial rhythm instead of falling back to a plain list.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="continuation-sidebar">
                        <StayPanel accommodation={accommodation} compact />
                        <MiniListPanel
                          title="Continue with"
                          items={continuedSupport.length ? continuedSupport.map((activity) => activity.title).slice(0, 3) : dayLocations}
                          compact
                          maxItems={2}
                        />
                        {chunkIndex === 0 && selectedAddOns.length ? (
                          <MiniListPanel
                            title="Available upgrades"
                            items={selectedAddOns.map((addOn) => [addOn.name, addOn.category].filter(Boolean).join(' • '))}
                            compact
                            maxItems={2}
                          />
                        ) : (
                          <MiniListPanel
                            title="Travel notes"
                            items={continuationNotes.length ? continuationNotes : (payload.itinerary.exclusions || []).slice(0, 3)}
                            compact
                            maxItems={2}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <PageFooter branding={payload.branding} />
                </div>
              </section>,
            );
          });

          return pages;
        })}
        <section className="page page--light">
          <div className="page__inner">
            <BrandRow branding={payload.branding} />
            <div className="operator-signoff">
              <div className="operator-signoff__lead">
                <div>
                  <div className="accent-line" style={{ background: accent }} />
                  <p className="section-kicker">Before Departure</p>
                  <h2 style={{ fontSize: 30, lineHeight: 1.08, letterSpacing: '-0.04em', margin: '8px 0 12px', fontFamily: '"Noto Serif", Georgia, Times New Roman, serif' }}>
                    A polished finish, ready to send
                  </h2>
                  <p className="body-copy" style={{ margin: 0 }}>
                    The itinerary now reads like an operator-branded dossier: highlights up front, daily chapters with visual structure, and logistics or package detail where they support the client handoff.
                  </p>
                </div>
                <PackagePanels payload={payload} />
                <LogisticsPanel payload={payload} />
              </div>
              <div className="trip-brief__sidebar">
                <div className="operator-card">
                  <p className="panel__title">Operator contact</p>
                  <div className="operator-card__name">{payload.branding.companyName}</div>
                  <p className="operator-card__copy">
                    {payload.branding.clientName
                      ? `Prepared for ${payload.branding.clientName}. Final confirmations, booking references, and last-mile notes can be layered into this packet before dispatch.`
                      : 'Use this page as the operator sign-off area for final contact details, confirmations, and curated notes.'}
                  </p>
                  {(payload.branding.contactEmail || payload.branding.contactPhone) ? (
                    <div className="body-copy" style={{ marginTop: 10 }}>
                      {[payload.branding.contactEmail, payload.branding.contactPhone].filter(Boolean).join('  •  ')}
                    </div>
                  ) : null}
                </div>
                {payload.itinerary.interests?.length ? (
                  <div className="sidebar-panel">
                    <p className="sidebar-panel__title">Tailored around</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {payload.itinerary.interests.map((interest, index) => (
                        <span key={`interest-${index}`} className="meta-pill" style={{ background: 'rgba(17,24,39,0.06)', color: 'rgba(17,24,39,0.75)', border: '1px solid rgba(17,24,39,0.08)' }}>{interest}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {!payload.itinerary.interests?.length && selectedAddOns.length ? (
                  <AddOnPanel addOns={selectedAddOns.slice(0, 4)} payload={payload} />
                ) : null}
              </div>
            </div>
            <PageFooter branding={payload.branding} />
          </div>
        </section>
    </>
  );
};

const LuxuryTemplate = ({ payload }: { payload: PreparedPrintPayload }) => (
  <>
    <section className="page page--dark immersive">
      <div className="cover">
        {payload.coverImage ? <img className="cover__image" src={payload.coverImage} alt={payload.itinerary.trip_title} /> : null}
        <div className="cover__overlay" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(5,5,5,0.88))' }} />
        <div className="cover__content">
          <BrandRow branding={payload.branding} dark />
          <div>
            <p className="cover__kicker" style={{ color: payload.branding.primaryColor || '#ccb27a' }}>Luxury Resort</p>
            <h1 className="cover__title" style={{ color: '#fffaf0' }}>{payload.itinerary.trip_title}</h1>
            <p className="cover__subtitle" style={{ color: 'rgba(255,250,240,0.82)' }}>{payload.itinerary.summary}</p>
            <div className="cover__meta">
              <span className="meta-pill" style={{ borderColor: 'rgba(204,178,122,0.52)', color: '#f8e8c5' }}>{payload.itinerary.destination}</span>
              <span className="meta-pill" style={{ borderColor: 'rgba(204,178,122,0.52)', color: '#f8e8c5' }}>{payload.itinerary.duration_days} Days</span>
            </div>
          </div>
          <PageFooter branding={payload.branding} />
        </div>
      </div>
    </section>
    <SummaryPage payload={payload} dark title="Private escape overview" />
    {payload.itinerary.days.map((day, index) => (
      <section key={`luxury-day-${index}`} className={`page page--dark ${payload.density}`}>
        <div className="page__inner">
          <div className="day-hero">
            {day.dayHeroImage ? <img className="day-hero__image" src={day.dayHeroImage} alt={day.theme} /> : <div className="panel panel--dark" style={{ minHeight: '82mm' }} />}
            <div>
              <div className="accent-line" style={{ background: payload.branding.primaryColor || '#ccb27a' }} />
              <p className="day-hero__eyebrow">Day {day.day_number}</p>
              <h2 className="day-hero__title" style={{ color: '#fffaf0' }}>{day.theme}</h2>
              <div className="day-hero__date">{formatDateLabel(day.date) || payload.itinerary.destination}</div>
              {day.summary ? <p className="body-copy" style={{ marginTop: 12 }}>{day.summary}</p> : null}
            </div>
          </div>
          <div className="three-col">
            {day.activities.map((activity, activityIndex) => (
              <div key={`lux-activity-${activityIndex}`} style={{ gridColumn: activity.printImageVariant === 'feature' ? 'span 2' : 'span 1' }}>
                <ActivityCard activity={activity} dark />
              </div>
            ))}
          </div>
          <PageFooter branding={payload.branding} />
        </div>
      </section>
    ))}
    <section className="page page--dark">
      <div className="page__inner">
        <BrandRow branding={payload.branding} dark />
        <div className="accent-line" style={{ background: payload.branding.primaryColor || '#ccb27a' }} />
        <p className="section-kicker" style={{ color: 'rgba(248,250,252,0.68)' }}>Concierge finish</p>
        <h2 style={{ fontSize: 30, lineHeight: 1.08, letterSpacing: '-0.04em', margin: '8px 0 12px', color: '#fffaf0' }}>
          Resort pacing, without losing the operational detail
        </h2>
        <PackagePanels payload={payload} dark />
        <PageFooter branding={payload.branding} />
      </div>
    </section>
  </>
);

const VisualTemplate = ({ payload }: { payload: PreparedPrintPayload }) => (
  <>
    <section className="page page--white immersive">
      <div className="cover">
        {payload.coverImage ? <img className="cover__image" src={payload.coverImage} alt={payload.itinerary.trip_title} /> : null}
        <div className="cover__overlay" style={{ background: 'linear-gradient(180deg, rgba(9,15,30,0.12), rgba(9,15,30,0.70))' }} />
        <div className="cover__content">
          <BrandRow branding={payload.branding} dark />
          <div>
            <p className="cover__kicker" style={{ color: '#fecdd3' }}>Visual Journey</p>
            <h1 className="cover__title" style={{ color: '#ffffff', maxWidth: '165mm' }}>{payload.itinerary.trip_title}</h1>
            <p className="cover__subtitle" style={{ color: 'rgba(255,255,255,0.88)' }}>{payload.itinerary.destination} in a more photographic, story-led print sequence.</p>
          </div>
          <PageFooter branding={payload.branding} />
        </div>
      </div>
    </section>
    <SummaryPage payload={payload} title="Journey Overview" />
    {payload.itinerary.days.map((day, index) => (
      <section key={`visual-day-${index}`} className={`page page--white ${payload.density}`}>
        <div className="page__inner">
          {day.dayHeroImage ? (
            <img
              src={day.dayHeroImage}
              alt={day.theme}
              style={{ width: '100%', height: '88mm', objectFit: 'cover', borderRadius: 24, marginBottom: '10mm' }}
            />
          ) : null}
          <div className="accent-line" style={{ background: payload.branding.primaryColor || '#e11d48' }} />
          <p className="section-kicker">Day {day.day_number}</p>
          <h2 style={{ fontSize: 34, lineHeight: 1.04, letterSpacing: '-0.04em', margin: '8px 0 10px' }}>{day.theme}</h2>
          {day.summary ? <p className="lead">{day.summary}</p> : null}
          <div className="stack" style={{ marginTop: '10mm' }}>
            {day.activities.map((activity, activityIndex) => (
              <div
                key={`visual-activity-${activityIndex}`}
                className="two-col"
                style={{
                  gridTemplateColumns: activityIndex % 2 === 0 ? '0.85fr 1.15fr' : '1.15fr 0.85fr',
                  direction: activityIndex % 2 === 0 ? 'ltr' : 'rtl',
                }}
              >
                <div style={{ direction: 'ltr' }}>
                  {activity.printImage ? (
                    <img src={activity.printImage} alt={activity.title} style={{ width: '100%', height: '64mm', objectFit: 'cover', borderRadius: 18 }} />
                  ) : (
                    <div className="panel" style={{ minHeight: '64mm' }} />
                  )}
                </div>
                <div className="panel" style={{ direction: 'ltr', alignSelf: 'stretch' }}>
                  <div className="activity-card__meta">
                    {activity.time ? <span>{activity.time}</span> : null}
                    {activity.location ? <span>{activity.location}</span> : null}
                  </div>
                  <h3 className="activity-card__title" style={{ fontSize: 22 }}>{activity.title}</h3>
                  <p className="body-copy">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
          <PageFooter branding={payload.branding} />
        </div>
      </section>
    ))}
  </>
);

const BentoTemplate = ({ payload }: { payload: PreparedPrintPayload }) => {
  const mosaicImages = payload.itinerary.days
    .flatMap((day) => day.activities.map((activity) => activity.printImage).filter(Boolean))
    .slice(0, 5) as string[];

  return (
    <>
      <section className="page page--white immersive">
        <div className="page__inner">
          <BrandRow branding={payload.branding} />
          <div className="accent-line" style={{ background: payload.branding.primaryColor || '#6366f1' }} />
          <p className="section-kicker">Bento Journey</p>
          <h1 className="cover__title" style={{ marginTop: 0 }}>{payload.itinerary.trip_title}</h1>
          <p className="lead">{payload.itinerary.summary}</p>
          <div className="mosaic">
            {mosaicImages[0] ? <div className="mosaic__cell mosaic__cell--a"><img className="mosaic__tile" src={mosaicImages[0]} alt="" /></div> : null}
            {mosaicImages[1] ? <div className="mosaic__cell mosaic__cell--b"><img className="mosaic__tile" src={mosaicImages[1]} alt="" /></div> : null}
            {mosaicImages[2] ? <div className="mosaic__cell mosaic__cell--c"><img className="mosaic__tile" src={mosaicImages[2]} alt="" /></div> : null}
            {mosaicImages[3] ? <div className="mosaic__cell mosaic__cell--d"><img className="mosaic__tile" src={mosaicImages[3]} alt="" /></div> : null}
            {mosaicImages[4] ? <div className="mosaic__cell mosaic__cell--e"><img className="mosaic__tile" src={mosaicImages[4]} alt="" /></div> : null}
          </div>
          <Metrics payload={payload} />
          <PageFooter branding={payload.branding} />
        </div>
      </section>
      {payload.itinerary.days.map((day, index) => (
        <section key={`bento-day-${index}`} className={`page page--white ${payload.density}`}>
          <div className="page__inner">
            <div className="bento-day-shell">
              <div>
                <div className="accent-line" style={{ background: payload.branding.primaryColor || '#6366f1' }} />
                <p className="section-kicker">Day {day.day_number}</p>
                <h2 style={{ fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '8px 0 10px' }}>{day.theme}</h2>
              </div>
              <div className="bento-day-top">
                <div className="bento-summary-card">
                  {day.dayHeroImage ? <img className="bento-day-hero" src={day.dayHeroImage} alt={day.theme} /> : <div className="panel" style={{ minHeight: '108mm' }} />}
                  <div className="bento-day-meta">
                    <div className="summary-band__card">
                      <div className="summary-band__label">Date</div>
                      <div className="summary-band__value">{formatShortDate(day.date) || `Day ${day.day_number}`}</div>
                    </div>
                    <div className="summary-band__card">
                      <div className="summary-band__label">Stops</div>
                      <div className="summary-band__value">{day.activities.length}</div>
                    </div>
                    <div className="summary-band__card">
                      <div className="summary-band__label">Focus</div>
                      <div className="summary-band__value">{day.activities[0]?.location || payload.itinerary.destination}</div>
                    </div>
                  </div>
                </div>
                <div className="bento-rail">
                  <div className="panel">
                    <p className="panel__title">Day brief</p>
                    <p className="lead" style={{ margin: 0 }}>{day.summary || 'A modular sequence built to feel visual and easy to scan in print.'}</p>
                  </div>
                  {day.activities.slice(0, 2).map((activity, activityIndex) => (
                    <div key={`bento-top-${activityIndex}`} className="bento-panel">
                      {activity.printImage ? <img className="bento-panel__image" src={activity.printImage} alt={activity.title} /> : null}
                      <div className="bento-panel__body">
                        <div className="bento-panel__meta">
                          {[activity.time, activity.location].filter(Boolean).join(' • ')}
                        </div>
                        <h3 className="bento-panel__title">{activity.title}</h3>
                        <p className="bento-panel__desc">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bento-grid">
                {day.activities.slice(2).map((activity, activityIndex) => (
                  <div key={`bento-activity-${activityIndex}`} className="bento-panel">
                    {activity.printImage ? <img className="bento-panel__image" src={activity.printImage} alt={activity.title} /> : null}
                    <div className="bento-panel__body">
                      <div className="bento-panel__meta">
                        {[activity.time, activity.location].filter(Boolean).join(' • ')}
                      </div>
                      <h3 className="bento-panel__title">{activity.title}</h3>
                      <p className="bento-panel__desc">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <PageFooter branding={payload.branding} />
          </div>
        </section>
      ))}
    </>
  );
};

const UrbanTemplate = ({ payload }: { payload: PreparedPrintPayload }) => (
  <>
    <section className="page page--white immersive">
      <div className="page__inner">
        <BrandRow branding={payload.branding} />
        <div style={{ height: 5, width: '100%', background: payload.branding.primaryColor || '#124ea2', marginBottom: '10mm', borderRadius: 999 }} />
        <div className="brief-grid">
          <div>
            <p className="section-kicker">Urban Brief</p>
            <h1 className="cover__title" style={{ marginTop: 0 }}>{payload.itinerary.trip_title}</h1>
            <p className="lead">{payload.itinerary.summary}</p>
            <Metrics payload={payload} />
          </div>
          <div className="panel">
            <p className="panel__title">Executive Summary</p>
            <div className="stack--tight">
              <div className="body-copy"><strong>Destination</strong><br />{payload.itinerary.destination}</div>
              <div className="body-copy"><strong>Trip Dates</strong><br />{formatShortDate(payload.itinerary.start_date) || 'Flexible'}{payload.itinerary.end_date ? ` — ${formatShortDate(payload.itinerary.end_date)}` : ''}</div>
              <div className="body-copy"><strong>Image Quality</strong><br />{payload.imageStats.uniqueActivityImages} unique visual assets prepared</div>
            </div>
          </div>
        </div>
        <PageFooter branding={payload.branding} />
      </div>
    </section>
    {payload.itinerary.days.map((day, index) => (
      <section key={`urban-day-${index}`} className={`page page--white ${payload.density}`}>
        <div className="page__inner">
          <div className="brief-grid">
            <div>
              <p className="section-kicker">Day {day.day_number}</p>
              <h2 style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '8px 0 10px' }}>{day.theme}</h2>
              {day.summary ? <p className="body-copy">{day.summary}</p> : null}
              {day.dayHeroImage ? (
                <img src={day.dayHeroImage} alt={day.theme} style={{ width: '100%', height: '72mm', objectFit: 'cover', borderRadius: 16, marginTop: '8mm' }} />
              ) : null}
            </div>
            <div className="panel">
              <p className="panel__title">Schedule Brief</p>
              <table className="brief-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Stop</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {day.activities.map((activity, activityIndex) => (
                    <tr key={`urban-row-${activityIndex}`}>
                      <td>{activity.time || 'Flexible'}</td>
                      <td>
                        <strong>{activity.title}</strong>
                        <div style={{ color: 'rgba(17,24,39,0.62)', marginTop: 4 }}>{activity.description}</div>
                      </td>
                      <td>{activity.location || payload.itinerary.destination}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PageFooter branding={payload.branding} />
        </div>
      </section>
    ))}
  </>
);

const ProfessionalTemplate = ({ payload }: { payload: PreparedPrintPayload }) => (
  <>
    <section className="page page--white immersive">
      <div className="page__inner">
        <BrandRow branding={payload.branding} />
        <div style={{ borderTop: `4px solid ${payload.branding.primaryColor || '#124ea2'}`, paddingTop: '9mm' }}>
          <p className="section-kicker">Professional</p>
          <h1 className="cover__title" style={{ marginTop: 0 }}>{payload.itinerary.trip_title}</h1>
          <p className="lead">{payload.itinerary.summary}</p>
          <Metrics payload={payload} />
        </div>
        <div style={{ marginTop: '10mm' }}>
          <LogisticsPanel payload={payload} />
        </div>
        <PageFooter branding={payload.branding} />
      </div>
    </section>
    {payload.itinerary.days.map((day, index) => (
      <section key={`pro-day-${index}`} className={`page page--white ${payload.density}`}>
        <div className="page__inner">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: '8mm' }}>
            <div>
              <p className="section-kicker">Day {day.day_number}</p>
              <h2 style={{ fontSize: 30, lineHeight: 1.06, letterSpacing: '-0.04em', margin: '8px 0 0' }}>{day.theme}</h2>
            </div>
            <div className="day-hero__date">{formatDateLabel(day.date)}</div>
          </div>
          {day.summary ? <p className="body-copy" style={{ marginBottom: '8mm' }}>{day.summary}</p> : null}
          <div className="activity-list">
            {day.activities.map((activity, activityIndex) => <ActivityCard key={`pro-activity-${activityIndex}`} activity={activity} />)}
          </div>
          <PageFooter branding={payload.branding} />
        </div>
      </section>
    ))}
    <section className="page page--white">
      <div className="page__inner">
        <BrandRow branding={payload.branding} />
        <p className="section-kicker">Closing details</p>
        <h2 style={{ fontSize: 28, lineHeight: 1.08, letterSpacing: '-0.04em', margin: '8px 0 10px' }}>Final package notes</h2>
        <PackagePanels payload={payload} />
        <PageFooter branding={payload.branding} />
      </div>
    </section>
  </>
);

const TEMPLATE_MAP: Record<ItineraryTemplateId, (props: { payload: PreparedPrintPayload }) => React.ReactElement> = {
  safari_story: SafariTemplate,
  luxury_resort: LuxuryTemplate,
  visual_journey: VisualTemplate,
  bento_journey: BentoTemplate,
  urban_brief: UrbanTemplate,
  professional: ProfessionalTemplate,
};

const ItineraryPrintDocument = ({ payload }: { payload: PreparedPrintPayload }) => {
  const Template = TEMPLATE_MAP[payload.template] || SafariTemplate;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
        <title>{payload.itinerary.trip_title}</title>
      </head>
      <body className={`${payload.density} template-${payload.template}`}>
        <Template payload={payload} />
      </body>
    </html>
  );
};

export const renderItineraryPrintHtml = async (payload: PreparedPrintPayload) => {
  const { prelude } = await prerender(<ItineraryPrintDocument payload={payload} />, {
    bootstrapScripts: [],
  });
  const chunks: Buffer[] = [];
  const reader = prelude.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
};
