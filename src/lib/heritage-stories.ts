export type HeritageStory = {
  id: string;
  kicker: string;
  title: string;
  standfirst: string;
  paragraphs: string[];
  sources: { label: string; href: string }[];
};

const sixNations = (slug: string) => ({ label: "Six Nations Rugby — match report and archive", href: `https://www.sixnationsrugby.com/en/m6n/news/${slug}` });

export const matchStories: HeritageStory[] = [
  {
    id: "croke-park-2007", kicker: "2007 · Croke Park, Dublin · Ireland 43–13 England",
    title: "Croke Park: Ireland turn an extraordinary occasion into a statement",
    standfirst: "A day weighted with history was settled by the clarity and force of Ireland’s rugby.",
    paragraphs: [
      "Before the first tackle, this was already an occasion unlike any other. With Lansdowne Road being rebuilt, Ireland were playing at Croke Park, the home of the Gaelic Athletic Association. England’s visit gave the fixture a significance far beyond the Championship table. But Ireland also had an immediate sporting problem to solve: defeat by France had damaged their title challenge, and another loss would leave little room for recovery.",
      "The answer was a performance of startling control. Ireland carried with purpose, made England defend repeatedly and converted pressure into points. First-half tries from Girvan Dempsey and David Wallace helped establish a 23–3 interval lead. Ronan O’Gara’s kicking kept the scoreboard moving; the occasion’s emotion had been turned into territory, possession and a commanding advantage.",
      "England found a response through David Strettle, but there was no sustained reversal. Shane Horgan and replacement scrum-half Isaac Boss added tries as Ireland pulled away. The final margin was thirty points. A match that could have become frantic instead became a demonstration of how a team can carry an enormous occasion without losing its shape.",
      "The 43–13 result remains inseparable from its setting, yet the rugby deserves its own place in the memory. Ireland had not merely won a symbolic fixture. They had dismantled a major rival, revived their Championship challenge and given the crowd a performance large enough to match the day. Croke Park’s significance and Ireland’s precision made this much more than another entry in the results book.",
    ],
    sources: [
      {label: "Six Nations Rugby — Ireland v England, 24 February 2007", href: "https://www.sixnationsrugby.com/en/m6n/fixtures/200700/ireland-v-england-24022007-1730/timeline"},
      {label: "Six Nations Rugby — Croke Park match report", href: "https://www.sixnationsrugby.com/it/m6n/notizia/ireland-crush-england-43-13-at-croke-park-3"},
    ],
  },
  {
    id: "rome-2011", kicker: "2011 · Stadio Flaminio, Rome · Italy 22–21 France",
    title: "Four minutes to hold on: Italy’s Roman breakthrough",
    standfirst: "Twelve points behind, Italy found a route back through Andrea Masi’s running and Mirco Bergamasco’s nerve.",
    paragraphs: [
      "For much of the afternoon, the familiar ending seemed to be taking shape. France led 8–6 at half-time, and Morgan Parra’s converted try stretched the advantage to 18–6. Italy had never beaten France in the Six Nations. With half an hour left, they faced both a formidable opponent and the weight of all those previous disappointments.",
      "Andrea Masi changed the mood. His try gave Italy a way into the contest and turned the Flaminio from a place hoping for resistance into a ground sensing an upset. Mirco Bergamasco supplied the other essential ingredient: points whenever France offered an opportunity. The gap began to close, and a match the visitors had appeared to control became a test of composure.",
      "France still led deep into the second half, but Bergamasco’s fifth penalty put Italy ahead with four minutes remaining. Now there was nothing glamorous about the task. Italy had to survive the next collision, the next scrum and the next attempt to force their line. The last passages were about holding a narrow lead, not producing another spectacular score.",
      "They held it. At 22–21, Italy had secured their first Championship victory over France and a moment to stand beside the great days of their rugby history. The win did not transform the final table into a triumph; it transformed what this particular afternoon meant. For Masi, Bergamasco and their teammates, the long fight for a breakthrough finally had its reward.",
    ],
    sources: [sixNations("bergamasco-puts-the-boot-into-france"), {label: "Italian Rugby Federation — report from the Flaminio", href: "https://www.federugby.it/litalia-fa-la-storia-francia-battuta-trofeo-garibaldi-in-bacheca/"}],
  },
  {
    id: "cardiff-2013", kicker: "2013 · Millennium Stadium, Cardiff · Wales 30–3 England",
    title: "The decider that became a Welsh procession",
    standfirst: "England came for a Grand Slam. Wales took the match, the title and almost every argument on the field.",
    paragraphs: [
      "Two versions of the same afternoon were possible when England arrived in Cardiff. For the visitors, a fifth victory would complete the Grand Slam. For Wales, a big enough win would rescue a campaign that had begun with defeat by Ireland and turn it into a successful title defence. The fixture had become both a final examination and a direct contest for the Championship.",
      "Wales established the terms through their forwards and their defence. England struggled to create the clean attacking platform they needed, while the home side kept accumulating pressure. At half-time it was 9–3: a lead, but still a scoreline tight enough to make every penalty and every missed opportunity feel decisive.",
      "The second half broke the contest open. Alex Cuthbert scored twice, applying the finishing touches as Wales turned their superiority into tries. England’s hopes of a Slam disappeared first; the possibility of salvaging the title followed. By the closing stages, the question was no longer whether Wales had done enough but how far they would pull clear.",
      "The 30–3 score was an emphatic answer. Wales finished above England on points difference and retained the Championship, a remarkable recovery from their opening setback. The match endures because of the gap between its promise and its outcome: a delicately balanced decider became an overwhelming demonstration of Welsh power. England’s coronation never arrived. Wales supplied their own.",
    ],
    sources: [{label: "World Rugby — 2013 Six Nations statistical report", href: "https://resources.world.rugby/worldrugby/document/2022/08/24/8619545a-6edd-4302-ae5d-c75e6b78aa48/6_Nations_Analysis_2013.pdf"}, {label: "Welsh Rugby Union — Championship history", href: "https://www.wru.wales/about-the-wru/"}],
  },
  {
    id: "super-saturday-2015", kicker: "2015 · Twickenham, London · England 55–35 France",
    title: "Fifty-five points, and still not enough",
    standfirst: "On the day the Championship became a race against arithmetic, England and France supplied its wildest final act.",
    paragraphs: [
      "By the time England and France kicked off, the target was brutally clear. Wales and Ireland had already won their matches, and Ireland’s points difference was the mark England had to beat. A victory on its own would not do. England needed a margin of 26, making every French score as damaging as an English score was valuable.",
      "The result was a contest played with the urgency of a closing minute stretched across an entire match. England attacked because they had to, and France kept finding answers. Tries brought celebration without security. The home crowd had to read two scoreboards at once: the one showing who was winning at Twickenham and the invisible one deciding who would finish above Ireland.",
      "Twelve tries and ninety points later, England led 55–35. In almost any other Championship afternoon, that would have been an extraordinary victory to celebrate without qualification. Here it left them short. One more converted try would have changed everything, and the closing attack carried the possibility of turning a memorable match into a title-winning one.",
      "It never came. England had won by twenty and Ireland remained champions. The strange power of this match lies in that contradiction: a team scoring fifty-five points could leave disappointed, while supporters elsewhere celebrated a French resistance that had still conceded seven tries. Super Saturday had made the whole tournament feel like one connected game, with the final answer delayed until the very last possession.",
    ],
    sources: [sixNations("relive-the-drama-of-super-saturday-2015"), {label: "World Rugby — 2015 Six Nations statistical report", href: "https://resources.world.rugby/test/worldrugby/document/2015/04/20/3ef09898-c8a1-4043-b060-75b043138015/150417_RJ_6_NATIONS_STATISTICAL_REPORT.pdf"}],
  },
  {
    id: "paris-2018", kicker: "2018 · Stade de France, Paris · France 13–15 Ireland",
    title: "Forty-one phases to keep a Grand Slam alive",
    standfirst: "Ireland’s title campaign began with a rescue mission, finished by Johnny Sexton from long range.",
    paragraphs: [
      "Ireland had spent much of the opening match building a modest advantage in difficult conditions. Sexton’s penalties rewarded control, but the lead was never large enough to settle the contest. Then Teddy Thomas broke away for France. The converted try put the hosts 13–12 ahead and forced Ireland to confront the possibility that their Championship ambitions would suffer an immediate blow.",
      "What followed was an extraordinary exercise in refusing to surrender the ball. Ireland worked through forty-one phases, moving from their own territory while every carry and clean-out threatened to become the last. Time had ceased to offer another chance. A handling error, an isolated runner or a penalty conceded would finish the game.",
      "Sexton finally stood deep enough to attempt the drop goal. Conor Murray supplied the pass, and the fly-half struck from beyond forty metres. The ball cleared the bar, changing 13–12 into 13–15 and transforming a French victory into an Irish escape. The most dramatic action had required a whole team to preserve the opportunity for it.",
      "Ireland went on to complete the Grand Slam, which gave the kick an even greater place in the story. But Paris should not be remembered as inevitable destiny. It was precarious, exhausting and almost lost. The later celebrations at Twickenham began with a team maintaining possession under intolerable pressure and a fly-half making the final, audacious decision.",
    ],
    sources: [sixNations("sexton-drop-goal-gives-ireland-last-gasp-victory-in-paris"), sixNations("story-of-the-2018-natwest-6-nations-ireland")],
  },
  {
    id: "calcutta-cup-2019", kicker: "2019 · Twickenham, London · England 38–38 Scotland",
    title: "From 31–0 to disbelief: the Calcutta Cup turned upside down",
    standfirst: "Scotland overturned a seemingly hopeless deficit, then England needed the final rescue.",
    paragraphs: [
      "At 31–0, the contest appeared finished. England had torn through Scotland and secured four tries before the break. There was no title left to decide, with Wales already champions, but the Calcutta Cup still mattered. For Scotland, the immediate task looked more like containing the damage than keeping the trophy.",
      "Stuart McInally’s try before half-time interrupted England’s momentum. After the interval, Scotland attacked with far greater freedom, and Finn Russell helped turn broken play into opportunity. Darcy Graham, Magnus Bradbury and Russell himself contributed to a surge that brought the score back to 31–31. What had looked like consolation became a genuine challenge for the match.",
      "Then Sam Johnson broke through for the try that put Scotland ahead. From thirty-one points down, they led 38–31. Yet England found one last answer: George Ford crossed and converted to force the draw. The final score was as hard to absorb as the sequence that had produced it.",
      "Scotland retained the Calcutta Cup, but the closing whistle carried complicated emotions on both sides. A draw could feel like escape for the team that had dominated the opening and disappointment for the team that had seemed beaten. Few matches expose the fragility of momentum so completely. Twickenham had watched certainty disappear, return in a different shirt and disappear once more.",
    ],
    sources: [sixNations("guinness-six-nations-flashback-2019-england-38-38-scotland"), {label: "Six Nations Rugby — match record", href: "https://www.sixnationsrugby.com/en/m6n/fixtures/201900/england-v-scotland-16032019-1700/report"}],
  },
];

export const playerStories: HeritageStory[] = [
  {
    id: "brian-odriscoll", kicker: "Ireland · Centre", title: "Brian O’Driscoll: the afternoon that changed the expectation",
    standfirst: "Paris announced the talent. Fifteen Championship campaigns revealed the full player.",
    paragraphs: [
      "In March 2000, Brian O’Driscoll scored three tries in Paris as Ireland won 27–25. The individual achievement was spectacular; the setting made it something larger. Ireland had endured a long wait for a victory in the French capital, and suddenly a young centre was finding ways through a defence that had so often made the fixture feel forbidding.",
      "The acceleration was obvious, but his game grew well beyond it. O’Driscoll could hold a defender with a change of angle, deliver a pass in traffic and turn defence into a contest for possession. He became a centre whose influence survived even when the ball was not travelling towards him.",
      "As captain of Ireland’s 2009 Grand Slam side, he helped convert a generation’s promise into the clean sweep it had pursued. The attacking gifts were now accompanied by the responsibility of leading a team through the moments when a Championship can unravel.",
      "His final international came back in Paris in 2014, with another narrow Irish victory and another title. The symmetry is irresistible, but it also captures the change he helped bring about: the city where a breakthrough once felt astonishing became the place where Ireland expected to compete for the trophy.",
    ], sources: [{label: "Irish Rugby — O’Driscoll’s international record", href: "https://www.irishrugby.ie/2014/03/15/brian-odriscoll-his-record-breaking-run"}, {label: "Irish Rugby — Championship memories in Paris", href: "https://www.irishrugby.ie/2024/02/01/farrell-weve-got-to-relish-these-occasions-and-go-after-them"}],
  },
  {
    id: "johnny-sexton", kicker: "Ireland · Fly-half", title: "Johnny Sexton: keeping the last option alive",
    standfirst: "His Paris drop goal was a flash of theatre built on the less glamorous work of control.",
    paragraphs: [
      "A fly-half’s great moment often looks solitary. In Paris in 2018, Johnny Sexton dropped into position, received the ball and sent it over the bar to beat France. Yet the kick only existed because Ireland had protected possession through forty-one phases. His defining image is also an image of dependence: one player finishing what the whole team had kept alive.",
      "That relationship ran through Sexton’s rugby. He needed his forwards to deliver usable ball, then made his own decisions close enough to the defensive line to bring others into the game. The pass, the kick and the threat of carrying had to look plausible until the last possible instant.",
      "Paris condensed those demands into a single closing sequence. Ireland could not simply wait for a comfortable position. The clock had gone, the defence was still there and the range was considerable. Sexton accepted the opportunity that existed rather than the ideal one that might never arrive.",
      "Ireland’s eventual Grand Slam made the moment a beginning as well as an ending. The kick closed a difficult match and opened a campaign that would finish unbeaten. It remains a vivid explanation of why tactical authority matters: control is the means of giving a team one more chance when the game appears to have taken them all away.",
    ], sources: [{label: "Irish Rugby — Sexton’s Paris match report", href: "https://www.irishrugby.ie/report/sextons-drop-of-magic-seals-dramatic-paris-win-for-ireland/amp/"}, sixNations("story-of-the-2018-natwest-6-nations-ireland")],
  },
  {
    id: "jonny-wilkinson", kicker: "England · Fly-half", title: "Jonny Wilkinson: precision at the point of maximum pressure",
    standfirst: "Before the World Cup drop goal came a Championship decider in Dublin and an emphatic answer to years of near misses.",
    paragraphs: [
      "England arrived at Lansdowne Road in 2003 with the Grand Slam still to be won. Previous campaigns had taught them how cruel the final hurdle could be. Ireland also entered the decider unbeaten, giving the afternoon the shape of a genuine final rather than a ceremonial conclusion.",
      "Wilkinson supplied order while England’s forwards supplied force. His kicking punished infringements and his distribution helped release a backline capable of doing much more than protecting a narrow lead. Two drop goals were part of a performance that kept finding profitable answers as the match developed.",
      "England won 42–6. The scale of the result can obscure the pressure that preceded it, but that is precisely why it mattered. A side repeatedly denied a clean sweep had completed one away from home with an authority that left no room for qualification.",
      "Wilkinson’s Championship legacy belongs in that wider picture. Accuracy was not decorative and preparation was not an end in itself. Both made ambitious rugby more dependable. The title formed part of the year that ended in World Cup victory, but Dublin had already demonstrated how devastating England could be when control and attacking power worked together.",
    ], sources: [sixNations("six-nations-rugby-2003-england-reach-zenith"), {label: "World Rugby — England finally deliver in Dublin", href: "https://www.world.rugby/news/686681/six-nations-memories-england-finally-deliver-in-dublin"}],
  },
  {
    id: "owen-farrell", kicker: "England · Fly-half / Centre", title: "Owen Farrell: the second decision-maker",
    standfirst: "England’s 2016 Grand Slam showed how a fly-half could shape a match from inside centre.",
    paragraphs: [
      "The shirt said twelve, but Owen Farrell’s job extended well beyond carrying into midfield. With George Ford at fly-half in 2016, England could ask two accomplished decision-makers to read the same defence. Farrell offered another passing option and another kicking threat, forcing opponents to consider more than the first receiver.",
      "That arrangement mattered in Paris, where England pursued their first Grand Slam since 2003. Early tries did not remove the pressure. France’s goal-kicking kept the hosts close enough to make the final stages uncomfortable, and England still had to turn their opportunities into a margin they could defend.",
      "Farrell finished with sixteen points from the boot in a 31–21 victory. His late penalties helped close the contest, giving the travelling support permission to celebrate the clean sweep. The contribution was both practical and tactical: the second playmaker was also the man converting infringements into scoreboard security.",
      "His place in Championship history is bound to that combination. The loudest part of a performance might be its direction or intensity, but the lasting value lay in repeated decisions made under pressure. In the 2016 side, Farrell helped England connect their attacking options to the discipline needed to finish a campaign unbeaten.",
    ], sources: [{label: "Euronews — France v England, 2016 Grand Slam report", href: "https://www.euronews.com/2016/03/19/six-nations-england-win-grand-slam-after-thrilling-win-over-france"}, {label: "Rugby World — England and France through the Six Nations era", href: "https://www.rugbyworld.com/news/le-crunch-here-is-the-history-of-every-mens-six-nations-game-between-england-and-france-174331"}],
  },
  {
    id: "antoine-dupont", kicker: "France · Scrum-half", title: "Antoine Dupont: the support runner who becomes the main event",
    standfirst: "In 2022, France’s captain supplied the finishing burst to a long-awaited Grand Slam.",
    paragraphs: [
      "A scrum-half is supposed to connect the forwards and backs. Antoine Dupont repeatedly makes that description feel too small. He can begin as the distributor, appear again on a runner’s shoulder and become the player a defence must stop. The danger is not confined to where he first touches the ball.",
      "France’s 2022 campaign gave those qualities a collective purpose. With the title and Grand Slam available against England in Paris, the team still needed to finish the job. Ireland’s earlier win had ensured there was no comfortable route to the trophy through a slip at the last hurdle.",
      "Dupont scored France’s third try in the 25–13 victory. The captain’s intervention helped settle a match that carried the expectations of a nation waiting for another clean sweep. It was a fitting image of his influence: alert to the space, quick enough to exploit it and present when the contest demanded a decisive action.",
      "His Player of the Championship award that year recognised more than one finish. The compelling feature of his game is the number of ways he can matter within a single passage. For France, that range turned a position usually associated with supplying opportunities into one that could also deliver the final blow.",
    ], sources: [sixNations("weekend-in-numbers-ten-interesting-stats-from-round-5"), sixNations("six-candidates-for-guinness-six-nations-player-of-the-championship")],
  },
  {
    id: "philippe-sella", kicker: "France · Centre", title: "Philippe Sella: a threat in every round",
    standfirst: "Four matches, four opponents, a try against each: the 1986 Championship captures the consistency behind his reputation.",
    paragraphs: [
      "A centre may spend long stretches waiting for the right ball. Philippe Sella built a career on making those moments count. In the 1986 Five Nations, he scored a try in every match, becoming only the fourth player to achieve that feat in a single campaign. Defences changed from week to week; the danger he posed remained.",
      "The record is useful because it moves the story beyond an isolated piece of flair. Sella’s attacking game had to survive different opponents, venues and match situations. Pace mattered, but so did the judgement of when to straighten, when to support and where the next opening might appear.",
      "His long international career carried him through the first three Rugby World Cups as well as successive Five Nations campaigns. That longevity gave French rugby a familiar presence in midfield while teams and tactical demands changed around him. The memorable attacker was also a durable part of the side’s structure.",
      "The 1986 sequence captures his influence: a decisive touch delivered repeatedly. In a tournament where every round alters the title race, Sella was a threat against everyone.",
    ], sources: [{label: "World Rugby Hall of Fame — Philippe Sella", href: "https://www.world.rugby/halloffame/inductees/704774"}],
  },
  {
    id: "stuart-hogg", kicker: "Scotland · Full-back", title: "Stuart Hogg: making the long way round look dangerous",
    standfirst: "His Championship rugby gave Scotland an attacking launch point deep behind the front line.",
    paragraphs: [
      "A kick towards Scotland’s backfield could offer Stuart Hogg the space he wanted. From full-back he had time to read the chase, then the acceleration to make a poorly connected defensive line pay. A position often judged by its security became a source of attacking possibility.",
      "The 2016 Championship showed the range of that threat. Against France he scored and helped create a try for Tim Visser as Scotland ended a long wait for a win in the fixture. Against Ireland he ran in from his own half, producing a spectacular score even in defeat.",
      "The following year, two tries against Ireland helped Scotland open with a 27–22 win at Murrayfield. Player of the Championship awards in both 2016 and 2017 recognised a sustained contribution rather than one burst of running. Opponents could not treat a clearance kick as the end of an attack without considering what he might do next.",
      "His playing story in this competition illustrates the effect of a dangerous counter-attacker. Space far from the opposition line can still become a scoring opportunity. Hogg gave Scotland a way to turn retreat into attack, and supporters a reason to look forward when the ball was travelling backwards.",
    ], sources: [sixNations("greatest-xv-profile-stuart-hogg"), sixNations("stuart-hoggs-greatest-moments")],
  },
  {
    id: "chris-paterson", kicker: "Scotland · Full-back / Wing / Fly-half", title: "Chris Paterson: the extraordinary value of getting it right",
    standfirst: "In 2007–08, a remarkable run of successful kicks made reliability a spectacle of its own.",
    paragraphs: [
      "There is a particular silence that belongs to a goal-kicker. The running stops, teammates wait and an entire passage of work becomes a question of one strike. Chris Paterson made those moments a source of reassurance for Scotland, turning a technically demanding skill into something supporters could almost take for granted.",
      "Almost is the important word. His sequence of thirty-six consecutive successful kicks for Scotland across ten months in 2007–08 included perfect returns at the 2007 World Cup and the 2008 Six Nations. The apparent routine was the achievement: changing grounds and match situations did not interrupt it.",
      "Paterson’s value also came from versatility. He appeared across the backline, bringing the perspective of a runner as well as a kicker. That breadth made him useful in different team shapes, while his work from the tee offered a dependable way to convert pressure into points.",
      "Championship history naturally favours spectacular tries and last-minute winners. Paterson’s story makes room for another kind of excellence: the discipline of repeating a difficult action until consistency itself becomes remarkable. For a side living through tight games, that was not a small contribution. It could be the difference between pressure that counted and pressure that disappeared.",
    ], sources: [{label: "Scottish Rugby — Hall of Fame, Chris Paterson", href: "https://scottishrugby.org/hall-of-fame/"}, {label: "Scottish Rugby — Paterson selected at fly-half in 2008", href: "https://scottishrugby.org/news-and-features/smith-on-scotland-recall/"}],
  },
  {
    id: "alun-wyn-jones", kicker: "Wales · Lock", title: "Alun Wyn Jones: the work that held a Grand Slam together",
    standfirst: "Wales’s 2019 captain made the repeated, punishing jobs feel central to the story.",
    paragraphs: [
      "Wales’s 2019 Grand Slam began with a recovery in Paris and ended with victory over Ireland in Cardiff. Between those moments lay five matches of accumulated strain. Alun Wyn Jones stood in the middle of it, leading a side whose defensive resolve repeatedly gave it a way through.",
      "The lock made eighty-one tackles across the campaign. That number describes repeated decisions to get back into position and make another collision, not simply a capacity to absorb punishment. In the lineout, his work also helped provide the possession from which Wales could build their own pressure.",
      "Jones’s Player of the Championship award put a forward’s contribution at the centre of a tournament often remembered through its finishers. His influence was visible in the places highlights can pass over: the secured ball, the defensive set and the willingness to repeat an effort late in a match.",
      "The captain lifting the trophy was the final image, but the substance came earlier. Wales had to win in different ways and in different countries, and their leader’s game supplied continuity through those changes. The 2019 campaign is a reminder that a Championship can be shaped as much by the player who keeps a side functioning as by the one who breaks a match open.",
    ], sources: [sixNations("player-of-the-championship-classic-winners-alun-wyn-jones-2019"), sixNations("wales-captain-alun-wyn-jones-crowned-2019-guinness-six-nations-player-of-the-championship")],
  },
  {
    id: "shane-williams", kicker: "Wales · Wing", title: "Shane Williams: a small gap was enough",
    standfirst: "Six tries in the 2008 Grand Slam made elusive running one of the Championship’s decisive weapons.",
    paragraphs: [
      "Shane Williams did not need a defence to fall apart. A defender’s balance shifting in the wrong direction could be enough. His acceleration and changes of step made the touchline less of a boundary than an invitation to create room where there appeared to be very little.",
      "The 2008 Championship brought those qualities together across an entire campaign. Wales were rebuilding after a damaging World Cup exit, with Warren Gatland newly in charge. Williams scored six tries as the side completed the Grand Slam, giving its renewed organisation a finishing threat that opponents repeatedly struggled to contain.",
      "Two tries against Scotland were followed by another pair against Italy. His contribution was not confined to the more open games: he also supplied Wales’s try in the tight victory over Ireland. The same elusive player could be decisive when chances were scarce as well as when the attack was flowing.",
      "Player of the Championship recognition followed. The appeal of his story lies in the way his skills remained effective against increasingly powerful professional defences. Williams gave Wales more than memorable steps. He offered a repeatable route to points, and in 2008 that route helped carry them through all five opponents without a defeat.",
    ], sources: [sixNations("player-of-the-championship-classic-winners-shane-williams-2008"), sixNations("williams-claims-writers-prize")],
  },
  {
    id: "sergio-parisse", kicker: "Italy · Number eight", title: "Sergio Parisse: invention from the back of the scrum",
    standfirst: "Italy’s long-serving number eight made ambition part of the team’s identity, even when the scoreboard offered little encouragement.",
    paragraphs: [
      "Sergio Parisse could collect the ball at the base of a scrum and make the next movement difficult to predict. He had the size to carry, the hands to distribute and the athleticism to appear where an opponent expected a back. The position described where he started, not the full range of what he could do.",
      "Across sixty-nine Six Nations appearances, all starts, he became a constant in Italy’s Championship story. From 2008 through 2019 he was their captain in the competition, bearing responsibility during difficult campaigns as well as the afternoons that rewarded the struggle.",
      "The memorable victories mattered because they punctuated so many demanding weeks. His early try against France in 2013 helped set the tone for another Italian win over their continental neighbours. At such moments, the skill and ambition that were always present had a result substantial enough to match them.",
      "Parisse’s place in this history cannot be measured by title medals. It rests on the breadth of his rugby and the persistence of his contribution. He gave Italy a player around whom an attack could think expansively, and a leader whose career linked successive generations of a side still working to establish its place among the tournament’s powers.",
    ], sources: [sixNations("50-days-to-go-the-ultimate-guinness-six-nations-half-century-xv"), sixNations("italy-fans-name-dream-azzurri-six-nations-xv"), sixNations("italy-team-news-v-france-six-nations")],
  },
  {
    id: "andrea-masi", kicker: "Italy · Centre / Full-back", title: "Andrea Masi: the runner who reopened the contest",
    standfirst: "His 2011 award grew from a campaign in which Italy’s most memorable breakthrough began with his try.",
    paragraphs: [
      "At 18–6 down against France in Rome, Italy needed more than another period of respectable resistance. Andrea Masi’s try supplied the action that changed what was possible. The deficit narrowed, the crowd had something tangible to chase and a match drifting away became a contest again.",
      "Mirco Bergamasco’s kicking eventually settled the 22–21 victory, but Masi’s role shows why a scoring sequence is rarely the work of its final hero alone. The runner who creates belief and the kicker who completes the recovery belong to the same story.",
      "Masi also scored Italy’s try in the following defeat by Scotland. Italy finished bottom of the table, yet his performances earned Player of the Championship recognition, making him the first Italian winner. The award separated an individual’s influence from the limitations of his side’s overall results.",
      "His direct running and versatility made him more than a specialist finisher. Yet the lasting image is simple: Italy needed a route back into the game, and Masi’s run gave them one.",
    ], sources: [sixNations("flashback-masi-the-master-rewarded-for-2011-italy-heroics")],
  },
];

export const milestoneStories: HeritageStory[] = [
  {
    id: "ireland-1948", kicker: "1948 · Ireland’s first Grand Slam", title: "Ravenhill, and the beginning of a sixty-one-year benchmark",
    standfirst: "Karl Mullen’s Ireland completed the clean sweep with a 6–3 win over Wales in Belfast.",
    paragraphs: [
      "The Championship had only recently resumed after the Second World War when Ireland assembled a campaign that would become a reference point for generations. Karl Mullen led the side, while Jack Kyle gave it imagination at fly-half. By the time Wales arrived at Ravenhill on 13 March 1948, three victories had left one final task.",
      "The margin tells something of the tension: 6–3. This was an era when a try was worth three points, and the scoreboard did not need to move often for every attack to carry enormous significance. Ireland won the final match and, with it, their first Grand Slam.",
      "Kyle’s brilliance has become central to the recollection, but the achievement belonged to Mullen’s whole side. Ireland had negotiated four different opponents in a competition still recovering its place after wartime interruption. The title was a sporting success with a particular place in the post-war landscape.",
      "Its historical weight grew because Ireland did not repeat the Slam until 2009. What had begun as one triumphant season became the standard against which later generations were measured. For sixty-one years, every promising Irish campaign carried the same distant comparison: could this team finally do what the men of 1948 had done?",
    ], sources: [{label: "Irish Rugby — the 1948 Grand Slam anniversary", href: "https://www.irishrugby.ie/2008/03/13/it-was-60-years-ago-today"}, {label: "Irish Rugby — remembering Jack Kyle’s playing career", href: "https://www.irishrugby.ie/2014/11/28/remembering-jack-kyles-playing-career/"}],
  },
  {
    id: "five-way-tie-1973", kicker: "1973 · Five teams, one shared title", title: "The Championship nobody could separate",
    standfirst: "Two wins and two defeats apiece left every nation sharing the title, but the season meant more than its peculiar table.",
    paragraphs: [
      "The final standings in 1973 look like a puzzle: England, France, Ireland, Scotland and Wales all finished with two wins and two losses. Under the rules then in force, there was no points-difference calculation to elevate one above the others. The Championship belonged to all five.",
      "The season also followed the unfinished tournament of 1972, when Scotland and Wales had not travelled to Dublin amid security concerns. England’s decision to make the journey in 1973 therefore carried meaning beyond an ordinary away fixture. The match took place, and Ireland won 18–9.",
      "England captain John Pullin’s remembered response at the post-match function placed the act of turning up alongside the result itself. In that context, completing a fixture was part of maintaining a sporting relationship during a frightening and divisive period. The tournament’s continuity could not simply be assumed.",
      "That gives the five-way tie a richer place in the archive. It is an astonishing statistical outcome, but also the conclusion of a season in which the act of playing mattered. The neat symmetry of the table sits beside a much less tidy history, reminding us that the Championship has never existed entirely outside the world around it.",
    ], sources: [{label: "Six Nations Rugby — Championship history", href: "https://www.sixnationsrugby.com/en/m6n/championship-history-mens"}, {label: "World Rugby — Ireland v England in 1973", href: "https://www.world.rugby/news/583314/10-miracle-matches-that-very-nearly-didnt-happen"}],
  },
  {
    id: "trophy-1993", kicker: "1993 · Silverware for the champions", title: "At last, something to lift",
    standfirst: "France became the first winners to receive a physical Championship trophy.",
    paragraphs: [
      "For generations, winning the Championship meant possession of a title rather than a trophy. The honour was perfectly real, recorded in results and remembered by supporters, but there was no central piece of silverware for the winning team to raise. In 1993, France became the first side to receive one.",
      "The original trophy had fifteen sides, a reference to the number of players in a rugby team. It gave a visible form to an achievement that had existed since the nineteenth century and created a new focal point for the end of a campaign.",
      "The change is easy to underestimate in an age when the presentation ceremony is an expected part of sport. A trophy gives photographs and television a shared final image: after weeks of separate matches, the competition can end with the winners gathered around one object.",
      "That first trophy remained in use into the Six Nations era before being replaced by a design reflecting all six competing countries. Its arrival marks a small but revealing transition in the tournament’s public life. An old honour had acquired a new ritual, and future champions would have something tangible to carry away.",
    ], sources: [{label: "World Rugby — the history of Championship silverware", href: "https://www.world.rugby/news/612211/seis-naciones-los-trofeos-en-juego"}, {label: "Six Nations Rugby — the Championship trophy", href: "https://www.sixnationsrugby.com/en/m6n/the-trophy"}],
  },
  {
    id: "points-difference-1994", kicker: "1994 · A different way to decide the title", title: "When the margin became part of the match",
    standfirst: "Points difference changed the meaning of scores made and conceded across an entire campaign.",
    paragraphs: [
      "For much of Championship history, teams finishing level on points shared the title. From 1994, points difference became the means of separating them. A familiar competition acquired a new calculation: winning mattered first, but the size of victories and defeats could now decide which team finished on top.",
      "The arithmetic was simple. Subtract points conceded from points scored, then compare the totals. Its effect on the experience of a title race was larger. A score in an apparently settled game could acquire importance weeks later; a late concession could follow a team into the final standings.",
      "The change also connected fixtures being played in different grounds. Supporters could watch one match while calculating what its result required from another. The Championship remained a round-robin contest, but its last weekend could now become a moving target rather than a sequence of isolated results.",
      "The spectacular 2015 finale showed how dramatic that mechanism could become. The rule itself supplied no tackles or tries, yet it altered the choices teams had to make. Championship history includes changes like this because the way a winner is decided can shape the rugby played in pursuit of the prize.",
    ], sources: [{label: "Six Nations Rugby — introduction of points difference", href: "https://www.sixnationsrugby.com/en/m6n/championship-history-mens"}, sixNations("six-legendary-moments-from-le-crunch")],
  },
  {
    id: "final-five-nations-1999", kicker: "1999 · Scotland win the final Five Nations", title: "A Scottish title, delivered with a Welsh flourish",
    standfirst: "The Five Nations ended with Scotland watching their fate turn on a try and conversion at Wembley.",
    paragraphs: [
      "Scotland had done what they could, beating France 36–22 in Paris. Their title challenge now depended on a match in which they would play no part. England faced Wales at Wembley, where the Welsh were staging home fixtures while their Cardiff stadium was rebuilt. An English win would complete the Grand Slam.",
      "Late in the match, England led 31–25. Then Scott Gibbs found the line and the angle that changed the Championship. His try brought Wales within a point, leaving Neil Jenkins with the conversion. The kick went over: Wales 32, England 31.",
      "The consequence travelled beyond Wembley. Scotland were champions on points difference, taking the final title of the Five Nations era. Their own performance in Paris had made the opportunity possible; Wales had supplied the result they could only hope for.",
      "Italy would join in 2000, changing the competition’s name and shape. The old format could scarcely have chosen a more dramatic farewell. One team celebrated winning a match, another celebrated winning the Championship, and England were left to absorb how quickly a clean sweep had become a lost title. The final Five Nations was decided through the relationships between its nations to the very end.",
    ], sources: [sixNations("five-of-the-best-final-championship-games"), sixNations("ten-of-the-greatest-wales-v-england-championship-clashes")],
  },
];
