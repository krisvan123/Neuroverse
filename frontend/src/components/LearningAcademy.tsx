import { useCallback, useEffect, useState } from 'react'
import { ACADEMY_RESET_EVENT, EMPTY_PROGRESS, readAcademyProgress, writeAcademyProgress, type AcademyProgress } from '../academy/progress'
import { ACADEMY_GLOSSARY, ACADEMY_LESSONS, ACADEMY_QUESTIONS, ACADEMY_REVIEWED, ACADEMY_SOURCE_BY_ID, ACADEMY_SOURCES } from '../academy/content'
import type { AcademyQuestion } from '../academy/content'
import { TeachingGraph } from './TeachingGraph'

function SourceLinks({ ids }: { ids: readonly string[] }) {
  return (
    <span className="academy-citations">
      {ids.map((id)=> {
        const ref=ACADEMY_SOURCE_BY_ID[id]
        if (!ref) return null
        return <a key={id} href={ref.url} target="_blank" rel="noopener noreferrer"
          title={ref.title+' — '+ref.section}>{id} ↗</a>
      })}
    </span>
  )
}

function KnowledgeCheck({
  question, choice, onChoose, marked, onCheck,
}:{
  question:AcademyQuestion
  choice:number|undefined
  onChoose:(value:number)=>void
  marked:number|undefined
  onCheck:()=>void
}) {
  const correct=marked===question.correct
  return (
    <fieldset className="academy-question">
      <legend>{question.prompt}</legend>
      <div className="academy-answer-list">
        {question.options.map((option,index)=>(
          <label key={option} className={choice===index?'academy-answer selected':'academy-answer'}>
            <input type="radio" name={'academy-'+question.id} checked={choice===index}
              onChange={()=>onChoose(index)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <button type="button" onClick={onCheck} disabled={choice===undefined} className="academy-check">
        Check answer
      </button>
      {marked!==undefined&&(
        <div role="status" aria-live="polite" className={correct?'academy-feedback correct':'academy-feedback incorrect'}>
          <strong>{correct?'Correct — evidence-backed reasoning.':'Not quite — try again.'}</strong>
          <p>{question.explanation}</p>
          <SourceLinks ids={question.sourceIds}/>
        </div>
      )}
    </fieldset>
  )
}

/** Minimal progress is retained on this browser only. Answers and personal
 * details never leave the page; completed checks may be safely revisited. */
export function LearningAcademy(){
  const [initial] = useState(readAcademyProgress)
  const [progress,setProgress] = useState<AcademyProgress>(initial.value)
  const [storageWarning,setStorageWarning] = useState(initial.warning)
  const [choices,setChoices] = useState<Record<string,number>>({})
  const [graded,setGraded] = useState<Record<string,number>>({})
  const active=progress.chapter
  const passed=new Set(progress.passed)
  const demoDone=progress.demoDone
  const lesson=ACADEMY_LESSONS[active]!
  const correctCount=passed.size
  const complete=correctCount===ACADEMY_QUESTIONS.length&&demoDone
  const remember=(next:AcademyProgress)=>{
    setProgress(next)
    try { writeAcademyProgress(next);setStorageWarning('') }
    catch(error) { setStorageWarning('This browser could not save progress: '+
      (error instanceof Error?error.message:'storage unavailable')) }
  }
  const markDemo=useCallback(()=>{
    if(!progress.demoDone)remember({...progress,demoDone:true})
  // Changes to temporary answer selection do not recreate this callback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[progress])
  const navigate=(index:number)=>{
    const chapter=Math.min(ACADEMY_LESSONS.length-1,Math.max(0,index))
    remember({...progress,chapter})
  }
  useEffect(()=>{
    const reset=()=>{
      setProgress({...EMPTY_PROGRESS,passed:[]})
      setChoices({});setGraded({})
      setStorageWarning('Learning progress was cleared on this browser.')
    }
    const sync=(event:StorageEvent)=>{
      if(event.key!==null&&event.key!=='neuroverse.academy.v1')return
      const loaded=readAcademyProgress()
      setProgress(loaded.value);setChoices({});setGraded({})
      setStorageWarning(loaded.warning)
    }
    window.addEventListener(ACADEMY_RESET_EVENT,reset)
    window.addEventListener('storage',sync)
    return ()=>{
      window.removeEventListener(ACADEMY_RESET_EVENT,reset)
      window.removeEventListener('storage',sync)
    }
  },[])
  const check=(question:AcademyQuestion)=>{
    const choice=choices[question.id]
    if(choice===undefined)return
    setGraded((prev)=>({...prev,[question.id]:choice}))
    if(choice===question.correct&&!passed.has(question.id))
      remember({...progress,passed:[...progress.passed,question.id]})
  }
  const select=(id:string,index:number)=>{
    setChoices((prev)=>({...prev,[id]:index}))
    setGraded((prev)=>{const copy={...prev};delete copy[id];return copy})
  }
  return (
    <section id="academy" className="academy-section container" aria-labelledby="academy-title">
      <div className="academy-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-dash"/> PHASE 06 / SCIENCE LEARNING ACADEMY</div>
          <h2 id="academy-title">Learn the science.<br/><em>Follow the evidence.</em></h2>
        </div>
        <p>Five complete chapters, one guided mission. Read the cited research, try a clearly synthetic graph, and check your understanding. No scientific-data download required.</p>
      </div>
      <div className="academy-mission">
        <div className="academy-mission-meta">
          <span>MISSION 001</span>
          <span>THE HIDDEN CONNECTIONS</span>
          <span>{correctCount}/10 answers correct</span>
        </div>
        <div className="academy-progress" role="progressbar" aria-valuemin={0} aria-valuemax={10} aria-valuenow={correctCount} aria-label="Knowledge checks answered correctly">
          <span style={{width:(correctCount*10)+'%'}}/>
        </div>
        <p className="academy-mission-summary">Your learning journey: discover neurons → investigate chemical synapses → read a connectome → traverse a graph → evaluate claims. Passed questions, your current chapter and graph-demo completion are saved only in this browser. No login or server sync.</p>
        {storageWarning&&<p className="academy-mission-status" role="alert">{storageWarning}</p>}
        <p className="academy-mission-status"><a href="#journal">Review, export or clear local learning data in the Research Journal ↗</a></p>
        {complete ? (
          <p className="academy-completed" role="status">✳ Mission 001 complete — all ten checks passed and the graph demo explored. You can now continue into the authentic Scientific Explorer.</p>
        ) : (
          <p className="academy-mission-status">{demoDone?'Interactive model complete.':'Interactive graph exercise still to complete.'} Answer all ten questions to finish the mission.</p>
        )}
      </div>
      <div className="academy-grid">
        <nav className="academy-chapters" aria-label="Academy lesson chapters">
          <p className="academy-nav-caption">YOUR FIVE CHAPTERS</p>
          {ACADEMY_LESSONS.map((entry,index)=>{
            const answered=entry.questionIds.filter((id)=>passed.has(id)).length
            return (
              <button type="button" key={entry.id} className={index===active?'academy-chapter active':'academy-chapter'}
                aria-current={index===active?'step':undefined} aria-pressed={index===active}
                onClick={()=>navigate(index)}>
                <span className="academy-chapter-index">{entry.id}</span>
                <span className="academy-chapter-main"><strong>{entry.title}</strong><small>{entry.duration} · {answered}/2 checked</small></span>
                <span aria-hidden="true">{answered===2?'✓':'↗'}</span>
              </button>
            )
          })}
          <div className="academy-nav-foot">
            <p>All chapters are freely accessible; you can revisit an answer at any time.</p>
            <a href="#academy-glossary">Open glossary ↓</a>
          </div>
        </nav>
        <article className="academy-lesson" aria-labelledby="academy-lesson-title" key={lesson.id}>
          <div className="academy-lesson-top"><span>{lesson.eyebrow}</span><span>{lesson.duration} READ</span></div>
          <h3 id="academy-lesson-title">{lesson.title}</h3>
          <p className="academy-outcome"><strong>You'll be able to:</strong> {lesson.outcome}</p>
          {lesson.sections.map((section)=>(
            <section className="academy-article-section" key={section.heading}>
              <h4>{section.heading}</h4>
              {section.paragraphs.map((paragraph,i)=><p key={i}>{paragraph}</p>)}
              <div className="academy-evidence"><span>CHECK THE EVIDENCE</span><SourceLinks ids={section.sourceIds}/></div>
            </section>
          ))}
          {lesson.demo&&<TeachingGraph onComplete={markDemo}/>}
          <div className="academy-takeaway">
            <span>KEY TAKEAWAY</span><p>{lesson.takeaway}</p>
          </div>
          <p className="academy-limitation"><strong>Scientific boundary:</strong> {lesson.limitation}</p>
          <div className="academy-quiz" aria-labelledby="academy-quiz-title">
            <div className="academy-quiz-heading">
              <h4 id="academy-quiz-title">Check what you've learned</h4>
              <p>Choose an answer, then check it to read why. You can try again. The score is for practice, not a certificate.</p>
            </div>
            {lesson.questionIds.map(id=>{
              const question=ACADEMY_QUESTIONS.find((q)=>q.id===id)!
              return <KnowledgeCheck key={id} question={question} choice={choices[id]}
                marked={graded[id]} onChoose={(index)=>select(id,index)} onCheck={()=>check(question)}/>
            })}
          </div>
          <div className="academy-lesson-footer">
            <button type="button" onClick={()=>navigate(active-1)} disabled={active===0}>← Previous chapter</button>
            {active<ACADEMY_LESSONS.length-1
              ? <button type="button" className="academy-forward" onClick={()=>navigate(active+1)}>Next chapter →</button>
              : <a className="academy-forward" href="#explore">Explore authentic FAFB anatomy ↗</a>}
          </div>
        </article>
      </div>
      <div className="academy-reference-footer">
        <details id="academy-glossary" className="academy-glossary" open>
          <summary>Science glossary — {ACADEMY_GLOSSARY.length} key terms</summary>
          <dl>{ACADEMY_GLOSSARY.map((entry)=>(
            <div key={entry.term}>
              <dt>{entry.term}</dt><dd>{entry.definition} <SourceLinks ids={entry.sourceIds}/></dd>
            </div>
          ))}</dl>
        </details>
        <details className="academy-sources" open>
          <summary>Primary sources & research methods</summary>
          <p className="academy-source-intro">All lesson explanations are original text with section-level source IDs. Source review: {ACADEMY_REVIEWED}. Links open the full resources. A citation supports the stated scope, not every possible inference from it.</p>
          <ol>{ACADEMY_SOURCES.map(source=>(
            <li key={source.id}>
              <strong>{source.id} · {source.publisher}</strong>
              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a>
              <small>Supporting section: {source.section}. Scope: {source.scope}</small>
            </li>
          ))}</ol>
        </details>
      </div>
    </section>
  )
}
