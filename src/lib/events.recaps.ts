/* ============================================================
   EVENT RECAPS - what happened at each past event, told in the
   past tense (the owner asked for this in place of a PAST status,
   2026-10-15). Each one keeps to the facts in the event's own CMS
   description. Keyed by slug; the entry panel shows the recap
   instead of the CMS text, and an event with no recap here keeps
   its CMS text. Server-only: import it through src/lib/events.ts.
   ============================================================ */
export const EVENT_RECAPS: Record<string, string> = {
  /* 2026 */
  "into-the-cyberverse":
    "Into The CyberVerse was our 101 on cybersecurity. Jaiganesh, Founder & CEO of SecureWorldz, took everyone through the basics in the First Floor Lab at RCC, then showed how it all works in a live, hands-on demo.",
  codestack:
    "CodeStack put full-stack skills to the test over two rounds. First came an MCQ round on web technologies and logic, then a bug-finding round where participants had to track down what was broken in real code and fix it.",
  "unlock-the-door":
    "Unlock The Door turned the IT Department into a puzzle trail. Teams worked through four doors, collected the story lines hidden behind each one, and pieced them together into a final arrangement that gave away a movie.",
  "quick-code":
    "Quick Code ran as a five-week MCQ challenge: every week, five questions and five minutes to answer them. Weekly winners went up on CSAU's Instagram stories, and a leaderboard kept count across all five weeks. Every week's questions and answers are in the archive.",
  "codeclash-hackathon":
    "CodeClash was an online mini hackathon hosted by the University of South Dakota on Zoom. Over a single evening, small curated teams took on real-world challenges drawn from industry, across AI, computer science, analytics and engineering.",
  "campus-to-corporate":
    "Campus to Corporate was an online session on making the jump from college to a career. Three seniors shared their journeys: Harish (CSE, 2025 batch, Verizon), Abharna Shree (IT, 2026 batch, Natwest) and Deepan (CSE, 2026 batch, Microsoft). Guidance today, career success tomorrow.",

  /* 2025 */
  "ai-product-management-and-vibe-coding-workshop":
    "The Vibe Coding Workshop went online on Teams with David Fuster Gonzalez, who brought 25+ years at Accenture, EY and Wipro. He showed how a product manager thinks, everyone tried building AI-powered prototypes with tools like Bolt and Lovable without writing code, and it closed with a first taste of vibe coding. Free and open to all.",
  "hit-bull-s-eye":
    "Hit Bull's Eye was our sharpshooting game at AGNI'25. Players dodged obstacles and threw sponge balls at targets projected on a screen, chasing the top score and the bragging rights that came with it.",
  quizzers:
    "Quizzers' Sundae was a tech and trivia showdown we ran with Quizzers Anonymous. It was played online through Instagram stories on @cegquizclub and @csau_ceg, and the quickest, sharpest answers took it.",
  "blockchain-workshop":
    "The Blockchain Workshop was a dive into Web3 at the Computing Lab, RCC. The founder of Web3 Chennai took everyone through blockchain basics, smart contracts and where they are used today, then talked about careers in Web3, with practical examples and time to network.",
  "profile-boost":
    "Profile Boost was an hour with alumni who have made it in tech. They shared how to sharpen a resume, polish a LinkedIn profile and prepare for interviews, and how to make internships and projects count when placements come around.",
  "intern-and-insights":
    "Intern and Insights was an online session on Teams where students who had landed internships told their stories: how they applied, what the interviews were like and how they prepared. Everyone had the chance to ask them anything.",
  "tour-de-code":
    "Tour de Code was a 10-hour DSA marathon at the Computing Lab, RCC, from 8 AM to 6 PM on 18 April. Teams of two or three worked through DSA challenges all day on caffeine and team spirit, with ₹6000 in prize money on the line.",
  codexcelerate:
    "CodeXcelerate: Code Velocity F1 was our race-themed event at Abacus'25. Over two rounds, teams rolled the die, solved coding puzzles and raced each other to the checkered flag, picking up bonus points along the way.",
  "jokers-gamble":
    "Joker's Gamble mixed coding with a card game. Over two rounds, coders tested their logic and strategy while card-game twists kept them on their toes, and every team had to decide whether to play it safe or risk it all.",
  "fruit-ninja-slice-and-solve":
    "Fruit Ninja: Slice and Solve was a two-round game for pairs. Teams picked easy words for quick points or hard ones for bigger rewards, all while dodging the taboo words that cost them. It was as much about laughing together as it was about winning.",
  "type-guess-win":
    "Type Pannu, Guess Pannu, Win Pannu was our event at Techofes 2025. First, teams threw, typed and decoded while a teammate raced the clock to crack the code; then came The Game of Strategy and Survival, where memory and tactics decided who made it through.",
  "gen-ai-masterclass":
    "The Gen AI Masterclass was a full day at Ramanujam Computing Centre, from concept to code. It was led by Mr. Magesh Rajamani, Senior Solution Architect at IBM Expert Labs, an IBM WatsonX specialist with 11 patents and a former CSAU President (1999-2000). He shared how AI systems are built with IBM WatsonX and ran hands-on sessions on real-world AI, and participants earned a completion certificate.",
  "git-set-go-3":
    "Git Set Go 3 was the finale of our Git series. We tied together everything from the earlier sessions, then played a Git-based game with prizes, so everyone walked out ready to use Git on their own.",
  "git-set-go-2":
    "In Git Set Go 2, things got practical. We worked hands-on with GitHub collaboration, covering branches, merges and pull requests, and how Git is used in real projects. Newcomers were brought up to speed along the way.",
  "git-set-go-1":
    "Git Set Go kicked off our Git series with an interactive, game-based session. We got to know GitHub, learned by doing, and had a lot of fun with version control.",

  /* 2024 */
  "tech-charades":
    "Tech Charades with AI turned tech jargon into a party game. Teams acted out AI-generated tech terms while their teammates raced to guess them, round after round.",
  "code-royale-battle-of-coders":
    "Code Royale: Battle of Coders was a straight-up coding battle in the IST Department's third floor lab. Participants solved tough problems against the clock, optimised their code and climbed the ranks.",
  "webinar-on-global-tech-development":
    "The Webinar on Global Tech Development brought in speakers from Sparta Coding Club, South Korea's leading coding institute. Over MS Teams, they walked us through the latest trends shaping tech around the world.",
  "the-sql-sleuth":
    "The SQL Sleuth was a mystery solved with SQL. Teams cracked encrypted queries, escaped virtual rooms and then worked through a murder mystery, using their DBMS and cryptography skills against the clock.",
  "code-cycle":
    "Code Cycle was a two-day online hackathon and workshop on Unstop. Participants learned Linux, JavaScript, deep learning and cryptography with expert guidance, then built projects of their own for a shot at the prizes.",
  "career-vitals":
    "Career Vitals took career help into the classrooms. We ran sessions on writing a strong resume, handling technical and HR interviews, and planning for placements and internships, for core and software roles alike, with guidance for students with arrears too.",
  "intern-mentor-iii":
    "Intern Mentor III was an online session on MS Teams about cracking internship interviews, for corporate and research roles alike. Mentors went through the do's and don'ts, what to prepare, how technical assessments work and how to build a resume that stands out.",
  "the-solvers-showdown":
    "The Solvers' Showdown was our coding event at ITRIX. The first round was MCQs, output prediction and pseudo-code; the second brought puzzles, obstacles and a little sabotage, where quick thinking and fast coding made the difference.",
  "source-code":
    "Source Code was a dual coding event all about debugging. Participants were handed programs full of errors and had to fix them until they ran and gave the right results.",
  "murderous-beats":
    "Murderous Beats was a murder mystery across the college. The story followed a famous singer returning to his alma mater; players traced his path from place to place, collecting clues and pieces of his story, and when he met a tragic end, they had to work out what really happened.",
  "dsa-express-2-0":
    "DSA Express 2.0 picked up where the first series left off. We went further into data structures and algorithms in C++, hands-on, with everyone welcome whatever their level.",

  /* 2023 */
  "hunt-of-web-wanderer":
    "Hunt of Web Wanderer was our treasure hunt at Utopia'23. With no instructions, just an app, players followed clues, a story and QR codes through a CEG-themed website to find the treasure hidden around the college.",
  "coding-chronicles":
    "Coding Chronicles: Tales of Tech Wizards was run together with I++. It started with cryptic coding puzzles and ended in a DSA escape room, where teams cracked cryptographic riddles to find their way out.",
  "code-quest":
    "Code Quest started with MCQs and moved on to DSA and debugging challenges, with plenty of hurdles and tasks in between. Creativity and logic were the order of the day in the CSE Department's third floor lab.",
  "dsa-express-a-journey-through-cpp-route":
    "DSA Express was a new series to get people coding from scratch. The sessions began with the basics of C++ and moved, at a comfortable pace, into data structures and algorithms.",
  "resume-revamp":
    "Resume Revamp was an evening on writing a resume that recruiters notice. Our guest, Vishnu Priya, a CEG alumna from the 2021 batch, shared the essentials of resume writing and how to stand out from the crowd.",
  "know-your-roll-no":
    "Know Your Roll No was our welcome for the new purple tags. Freshers got to know CSAU and everything being an AU student has to offer. No tech background was needed, just curiosity and a wish to learn together.",
  "code-smackdown":
    "Code Smackdown was run by ISTA together with CSAU. Coders were tested on speed, precision and ingenuity, and while there were winners, everyone left with new friends and good memories.",
  "code-with-memes":
    "Code With Memes was a CSAU and CSEA team-up that mixed coding challenges with memes. Participants coded, laughed and swapped tips, and the line between coder and memer got happily blurry.",
  "kavach-hackathon":
    "CEG's internal ideathon for Kavach 2023 picked the teams to represent us. After an intense round, the shortlisted teams moved on to take on national-level cybersecurity challenges at Kavach 2023.",
  "intern-mentor-ii":
    "Intern Mentor II walked students through getting an internship from A to Z: the steps, the stages, and scholarships both on and off campus. A lot of 2nd and 3rd year students came, and it was fully interactive, with their doubts cleared on the spot.",
  "cascading-into-ui-ux-and-figma":
    "Cascading into UI/UX and Figma took us from the backend to the front end. We looked at why good design matters and how Figma works, and since everyone brought laptops, they designed right along with us.",
  "door-to-open-source-window-of-opportunities":
    "Window of Opportunities was the third Door to Open Source session. Having learned Git and made their first contributions, participants found out about the open source programs out there, how contributing helps a career, and where to begin.",
  "door-to-open-source-gitting-it-right-commit-2":
    "GITting it Right, Commit #2 was the second Door to Open Source session. Participants got more comfortable with Git and walked through making open source contributions.",
  "door-to-open-source-gitting-it-right":
    "GITting it Right opened Door to Open Source, our first deep dive into open source. With layoffs in the news, we talked about which tech roles were holding steady, what remote work really looks like, and careers that don't revolve around DSA.",
  "escape-room":
    "The i++ Squid Game was hosted by ISTA and CSAU. Players in green tracksuits coded their way past bizarre obstacles for prizes, with deadly stakes, but only in fun. It wrapped up on 3 February.",

  /* 2022 */
  "mern-session-5-intro-to-mongodb":
    "MERN Session 5 introduced MongoDB. We carried on live coding the social media app from the earlier sessions and connected it to the database.",
  "hacker-instinct-a-venture-into-cyberspace":
    "Hacker Instinct was a cybersecurity seminar at the Ada Lovelace Auditorium. Industry experts explained SQL injection and other attacks, introduced penetration testing, and talked about careers in pen testing and cybersecurity.",
  "hands-on-with-mern":
    "Hands on with MERN was a live coding series where participants built a social media app from scratch. Each session took one part of the stack: React, Express, MongoDB and Node.js.",
  "resume-rewind":
    "Resume Rewind was an online session with Ms. Akhila Padmanaban, a CEG alumna and Software Engineer at Visa. For third and fourth years heading into internships and placements, she went through what belongs in a resume, and what to leave out, to make it look professional.",
  "pop-tech-quiz":
    "The Pop Tech Quiz was part of Techofes 2022, with teams from colleges across South India. Round one was multiple choice on pop culture; shortlisted teams then faced a buzzer round, where the first right answer took full points.",
  "abacus-web-design":
    "Abacus Web Design was part of ABACUS, the CSE Department's symposium. In the first round, teams turned a given design into a working webpage; those who made it through coded another page to match the theme. Over 300 participants in 60+ teams took part.",
  "blockchain-101":
    "Blockchain 101 was a free, open-to-all session with YBlockChain, a global blockchain community. It traced how the web has changed over the years, explained blockchain, NFTs and their uses, and closed with a Q&A where students asked about the finer points.",
  "ai-inception-intro-to-the-world-of-ai":
    "AI Inception was an introduction to AI for students from every department. It covered the types of machine learning, data types, regression, classification and performance metrics, showed how recommendation systems and image caption generators work, and ended hands-on: preprocessing, exploratory data analysis, applying ML algorithms and evaluating a model.",

  /* 2021 */
  "intern-mentor":
    "Intern Mentor was an interactive session on Microsoft Teams to help students go after internships, scholarships and more. Seniors explained what an internship is, how to apply and how to prepare, and cleared every doubt that came up.",
};
