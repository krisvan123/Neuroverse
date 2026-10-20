import { describe, expect, it } from 'vitest'
import {
 ACADEMY_GLOSSARY, ACADEMY_LESSONS, ACADEMY_QUESTIONS, ACADEMY_REVIEWED,
 ACADEMY_SOURCES,
} from './content'

describe('Phase 06 scientific teaching-content integrity', () => {
  const sources=new Set(ACADEMY_SOURCES.map((source)=>source.id))
  const questions=new Map(ACADEMY_QUESTIONS.map((q)=>[q.id,q]))
  it('contains five complete lessons with review date and no unreferenced factual sections', () => {
    expect(ACADEMY_REVIEWED).toMatch(/^2026-\d{2}-\d{2}$/)
    expect(ACADEMY_LESSONS).toHaveLength(5)
    expect(new Set(ACADEMY_LESSONS.map((l)=>l.id)).size).toBe(5)
    for (const l of ACADEMY_LESSONS) {
      expect(l.title.length).toBeGreaterThan(8)
      expect(l.outcome.length).toBeGreaterThan(15)
      expect(l.takeaway.length).toBeGreaterThan(20)
      expect(l.limitation.length).toBeGreaterThan(20)
      expect(l.sections.length).toBeGreaterThanOrEqual(2)
      expect(l.sourceIds.length).toBeGreaterThan(0)
      expect(l.questionIds).toHaveLength(2)
      for (const id of l.sourceIds) expect(sources.has(id)).toBe(true)
      for (const section of l.sections) {
        expect(section.heading.length).toBeGreaterThan(6)
        expect(section.paragraphs).toHaveLength(2)
        section.paragraphs.forEach((paragraph)=>expect(paragraph.length).toBeGreaterThan(90))
        expect(section.sourceIds.length).toBeGreaterThan(0)
        for (const id of section.sourceIds) expect(sources.has(id)).toBe(true)
      }
      for (const id of l.questionIds) expect(questions.has(id)).toBe(true)
    }
  })
  it('maps ten original comprehension questions to real sources and checked explanations', () => {
    expect(ACADEMY_QUESTIONS).toHaveLength(10)
    expect(new Set(ACADEMY_QUESTIONS.map(q=>q.id)).size).toBe(10)
    expect(new Set(ACADEMY_LESSONS.flatMap((l)=>l.questionIds)).size).toBe(10)
    for (const q of ACADEMY_QUESTIONS) {
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options).size).toBe(3)
      expect(q.correct).toBeGreaterThanOrEqual(0)
      expect(q.correct).toBeLessThan(3)
      expect(q.explanation.length).toBeGreaterThan(35)
      for(const id of q.sourceIds)expect(sources.has(id)).toBe(true)
    }
  })
  it('includes sourced glossary definitions and only known HTTPS source references', () => {
    expect(ACADEMY_GLOSSARY.length).toBeGreaterThanOrEqual(12)
    for (const entry of ACADEMY_GLOSSARY) {
      expect(entry.definition.length).toBeGreaterThan(24)
      for (const id of entry.sourceIds) expect(sources.has(id)).toBe(true)
    }
    for (const source of ACADEMY_SOURCES) {
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.section.length).toBeGreaterThan(12)
      expect(source.scope.length).toBeGreaterThan(20)
    }
  })
})
