
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Lightbulb,
  Scale
} from 'lucide-react';

const canons = [
  {
    number: '01 /',
    label: 'REASON',
    title: 'Socratic Dialectic',
    subtitle: 'A QUESTION OF REASON & PERSPECTIVE',
    description: 'Examine assumptions, challenge established ideas, and develop stronger arguments through thoughtful questioning.'
  },
  {
    number: '02 /',
    label: 'RHETORIC',
    title: 'Real-time Rhetorical Practice',
    subtitle: 'THE ART OF PERSUASION & CLARITY',
    description: 'Learn to communicate your ideas clearly, structure your thoughts, and respond to opposing arguments with confidence.'
  },
  {
    number: '03 /',
    label: 'EVIDENCE',
    title: 'The Art of Reasoned Argument',
    subtitle: 'VERIFIABLE FACTS & SOUND LOGIC',
    description: 'Build arguments supported by evidence, relevant examples, and logical reasoning rather than assumptions.'
  }
];

const topics = [
  {
    category: 'TECHNOLOGY',
    title: 'Resolved: Synthetic intelligence can surpass human creativity.',
    description: 'Examine whether artificial intelligence can produce genuinely original ideas or simply reproduce existing patterns.'
  },
  {
    category: 'EDUCATION',
    title: 'Resolved: Universal basic education should be freely accessible.',
    description: 'Consider equal opportunities, educational quality, and the responsibility of institutions.'
  },
  {
    category: 'SOCIETY',
    title: 'Resolved: Social media has weakened meaningful human connections.',
    description: 'Explore the relationship between digital communication and real-world relationships.'
  },
  {
    category: 'ETHICS',
    title: 'Resolved: Individual privacy should outweigh public convenience.',
    description: 'Question the balance between personal freedom, security, and technological progress.'
  }
];

function Home() {
  return (
    <div className="home-page">

      <section className="editorial-hero">
        <div className="editorial-hero-top">
          <div className="hero-main">
            <span className="editorial-label">
              A PLATFORM FOR THOUGHTFUL DEBATE & REASONED DISCUSSION
            </span>

            <h1>
              The art of disagreement,
              <em> restored to reason.</em>
            </h1>

            <div className="hero-actions">
              <Link to="/start-debate" className="editorial-button">
                Begin your dialogue <ArrowUpRight size={15} />
              </Link>

              <Link to="/signup" className="text-link">
                Create your account <ArrowRight size={13} />
              </Link>
            </div>

            <a href="#colloquia" className="text-link">
              Explore the topics worth discussing <ArrowRight size={13} />
            </a>

          </div>

          <div className="hero-aside">
            <p>
              Where human curiosity meets thoughtful disagreement.
              DebateAI is a space dedicated to reason, critical thinking,
              and mastering the classical canons of rhetoric.
            </p>

            <div className="hero-aside-details">
              <span>REASONED ARGUMENTATION</span>
              <span>INTELLECTUAL EXPLORATION</span>
            </div>
          </div>
        </div>

        <figure className="hero-photograph">
          <img
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1800&q=85"
            alt="A grand academic library filled with books"
          />
          <figcaption>
            <span>DEBATEAI / EST. 2026</span>
          </figcaption>
        </figure>
      </section>

      <section className="editorial-intro">
        <div className="intro-quote">
          <span className="editorial-label">THE PURPOSE OF REASON</span>
          <h2>
            "Most discourse has degenerated into reactive polemic.
            We built an intellect that does not flatter your bias."
          </h2>
          <span className="quote-credit">
            A DIFFERENT APPROACH TO DISCUSSION
          </span>
        </div>

        <div className="intro-description">
          <p>
            Every meaningful debate begins with curiosity and the
            willingness to consider a different perspective. It is
            the exchange of ideas, examination of evidence, and
            willingness to question assumptions that allow us to grow.
          </p>

          <p>
            DebateAI provides an environment where you can challenge
            your own thinking through structured discussions with an
            AI opponent, without the pressure of a public audience.
          </p>

          <blockquote>
            Intellectual humility is not the absence of conviction;
            it is the willingness to examine what you believe.
          </blockquote>
        </div>
      </section>

      <section className="canons-section">
        <div className="section-heading-row">
          <div>
            <span className="editorial-label">FOUNDATIONS OF DISCUSSION</span>
            <h2>The Three Canons of Deliberation</h2>
          </div>

          <p>
            A thoughtful approach to argumentation,
            built upon clarity, evidence and reason.
          </p>
        </div>

        <div className="canon-list">
          {canons.map((canon) => (
            <article className="canon-row" key={canon.number}>
              <div className="canon-number">
                <span>{canon.number}</span>
                <small>{canon.label}</small>
              </div>

              <div className="canon-title">
                <h3>{canon.title}</h3>
                <span>{canon.subtitle}</span>
              </div>

              <p>{canon.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="colloquia-section" id="colloquia">
        <div className="section-heading-row">
          <div>
            <span className="editorial-label">THE FORUM OF IDEAS</span>
            <h2>Current Colloquia</h2>
          </div>

          <p>
            Consider perspectives, question assumptions,
            and discover where your arguments lead.
          </p>
        </div>

        <div className="colloquia-list">
          {topics.map((topic, index) => (
            <article className="colloquium-row" key={topic.category}>
              <div className="colloquium-category">
                <span>DISCUSSION {String(index + 1).padStart(2, '0')}</span>
                <small>{topic.category}</small>
              </div>

              <div className="colloquium-content">
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
              </div>

              <Link
                to="/start-debate"
                className="colloquium-link"
                aria-label={`Explore ${topic.category} debate`}
              >
                Explore <ArrowUpRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="philosophy-section">
        <div className="philosophy-image">
          <img
            src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1000&q=85"
            alt="An open notebook and pen on a writing desk"
          />
        </div>

        <div className="philosophy-content">
          <span className="editorial-label">
            A DIFFERENT APPROACH TO LEARNING
          </span>

          <h2>
            "Debate does what solitary thought rarely has the
            patience to: it forces you to inhabit your opponent's
            strongest argument before you dare dismiss it."
          </h2>

          <p className="philosophy-author">The DebateAI Philosophy</p>

          <p className="philosophy-description">
            A space to develop independent thought, sharpen your
            reasoning, and approach disagreement with intellectual
            confidence.
          </p>

          <div className="philosophy-values">
            <div>
              <strong>01</strong>
              <span>Critical thinking</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Clear communication</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Reasoned argument</span>
            </div>
          </div>
        </div>
      </section>

      <section className="standards-section">
        <div className="section-heading-row">
          <div>
            <span className="editorial-label">PRINCIPLES OF DISCUSSION</span>
            <h2>The Comparative Standard of Discourse</h2>
          </div>

          <p>
            A debate should challenge your thinking,
            not simply confirm what you already believe.
          </p>
        </div>

        <div className="standards-grid">
          <div className="standards-column">
            <span className="standards-label">
              THE CONVENTIONAL APPROACH
            </span>

            <div>
              <h3>Ad Hominem Substitutions</h3>
              <p>
                Replace meaningful discussion with personal attacks
                instead of addressing the argument itself.
              </p>
            </div>

            <div>
              <h3>Duplication-Driven Arguments</h3>
              <p>
                Repeat familiar claims without examining their
                accuracy or relevance.
              </p>
            </div>

            <div>
              <h3>Unstructured Discussions</h3>
              <p>
                Allow conversations to drift without clear reasoning
                or a meaningful conclusion.
              </p>
            </div>
          </div>

          <div className="standards-column standards-highlight">
            <span className="standards-label">
              THE DEBATEAI STANDARD
            </span>

            <div>
              <h3>Strict Syllogistic Logic</h3>
              <p>
                Present arguments through structured reasoning,
                clear premises, and defensible conclusions.
              </p>
            </div>

            <div>
              <h3>Obligatory Steelmanning</h3>
              <p>
                Consider the strongest version of an opposing
                argument before forming a response.
              </p>
            </div>

            <div>
              <h3>Evidence-Based Reasoning</h3>
              <p>
                Support your position with relevant examples,
                reliable information, and logical consistency.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-cta">
        <span className="editorial-label">YOUR NEXT DISCUSSION</span>

        <h2>
          Sharpen your intellect against an unyielding standard.
        </h2>

        <p>
          Join a thoughtful exchange of perspectives, refine
          your reasoning, and discover what your arguments
          are truly capable of.
        </p>

        <div className="cta-actions">
          <Link to="/start-debate" className="editorial-button">
            Enter the discussion <ArrowRight size={15} />
          </Link>

          <Link to="/signup" className="cta-secondary">
            Create an account <ArrowUpRight size={14} />
          </Link>
        </div>

        <span className="cta-footnote">
          THINK INDEPENDENTLY. QUESTION THOUGHTFULLY. ARGUE WITH PURPOSE.
        </span>
      </section>

      <footer className="editorial-footer">
        <div className="footer-brand">
          <h3>DebateAI.</h3>
          <p>
            Where dialogue meets reason and curiosity
            becomes a discipline.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <span>EXPLORE</span>
            <Link to="/">Home</Link>
            <Link to="/start-debate">Start a Debate</Link>
            <Link to="/my-debates">My Debates</Link>
          </div>

          <div>
            <span>YOUR SPACE</span>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Create Account</Link>
          </div>

          <div>
            <span>OUR PRINCIPLES</span>
            <p>Critical Thinking</p>
            <p>Open Discussion</p>
            <p>Intellectual Growth</p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 DEBATEAI. ALL RIGHTS RESERVED.</span>
          <span>THINK. QUESTION. GROW.</span>
        </div>
      </footer>

    </div>
  );
}

export default Home;
