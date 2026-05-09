-- Project Shop seed: 13 initial projects authored by John Taddeo, Esq.
-- Date: 2026-05-08
--
-- Source: Projects_Spreadsheet_CSV (uploaded 2026-05-08 evening)
-- Author: john.taddeo@ptd.law (looked up via auth.users → professor_profiles)
--
-- Notes per locked decisions today:
--   • All 13 projects authored by John (single seed author for now)
--   • area_of_law: mapped from CSV values to canonical 39-item AREAS_OF_LAW
--     list per the proposed mapping (LLCs → Business Associations, Patent
--     Law → Patents, Music Licensing → Entertainment Law + Copyright, etc.)
--   • industries / tags / project_courses: LEFT EMPTY for now per user.
--     Filter rail will render those sections but show no matches until
--     John tags retroactively.
--   • image paths: /images/projects/projects-upload/<filename>.<ext>
--     served directly by Next.js (resolveImageUrl helper handles this)
--   • duration translated: 1h→1hr, 3h→3hr, 1w→1wk
--   • idempotent: each row gated by NOT EXISTS title-uniqueness check
--
-- To re-seed (if you delete and want to re-run): DELETE FROM public.projects
-- WHERE professor_id = <john's id>; then re-run this migration.

-- ─── Helper: resolve John's professor_id ─────────────────────────────────────

DO $seed$
DECLARE
  john_professor_id uuid;
BEGIN
  SELECT pp.id INTO john_professor_id
  FROM public.professor_profiles pp
  INNER JOIN auth.users u ON u.id = pp.user_id
  WHERE u.email = 'john.taddeo@ptd.law'
  LIMIT 1;

  IF john_professor_id IS NULL THEN
    RAISE EXCEPTION 'Seed failed: no professor_profiles row found for john.taddeo@ptd.law. Sign in / register first.';
  END IF;

  -- ─── Project 1: WHO IS MOON MAN?!! ─────────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'WHO IS MOON MAN?!!',
    'The Bigger The Brand, The Harder The Breakup.',
    $pitch$PROJECT: DJ MOON MAN® turns entertainment law into a full-scale brand war involving copyrights, trademarks, contracts, talent agency law, nightlife culture, social media empires, merchandising, comic books, anonymous performers, and millions of dollars in disputed intellectual property. Inspired by real entertainment industry dynamics and written in the style of a live client file, the project forces students to think like actual entertainment lawyers balancing legal doctrine, business leverage, human emotion, branding strategy, and litigation risk. Students don't just identify issues — they must decide who truly owns MOON MAN, whether the act can survive without its creator, and what happens when a fictional character becomes more valuable than the person inside the helmet.$pitch$,
    false, true, false, true, true, true,
    '1wk', true, true,
    ARRAY['Copyright','Trademark','Business Associations']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/who-is-moon-man-image-1.png', NULL, NULL,
    49.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'WHO IS MOON MAN?!!' AND professor_id = john_professor_id);

  -- ─── Project 2: FLEER MARVEL MASTERWORKS TRADING CARDS ─────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'FLEER MARVEL MASTERWORKS TRADING CARDS',
    'MARVEL COMICS CLASHES WITH FINE ARTS',
    $pitch$Based upon the real-life entertainment industry work of author John Taddeo, Esq. during his time at Marvel and Fleer, this negotiation project drops students into the middle of a high-stakes battle over the creation of the legendary Marvel Masterpieces trading card series. Students become outside counsel negotiating between Fleer/Marvel and the world-famous Hildebrandt Brothers as millions of dollars in artwork, licensing rights, publicity, creative control, reproduction rights, deadlines, and collectible value hang in the balance. This is not abstract contract theory. It is entertainment law, intellectual property, and business strategy colliding inside one of the most influential comic collectible projects of the 1990s.$pitch$,
    true, true, true, false, true, true,
    '3hr', true, false,
    ARRAY['Copyright','Negotiation']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/masterpieces-the-marvel-comics-brothers-hildebrandt-negotiations.jpeg', NULL, NULL,
    49.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'FLEER MARVEL MASTERWORKS TRADING CARDS' AND professor_id = john_professor_id);

  -- ─── Project 3: NEIL GAIMAN'S MR. HERO PROJECT ─────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'NEIL GAIMAN''S MR. HERO PROJECT',
    'Who Owns The Hero-verse?',
    $pitch$Students don't just study copyright law — they become entertainment lawyers protecting a live multimedia franchise from future ownership wars. Using Zoom Suit and Aalmuhammed v. Lee, students draft real-world work-for-hire agreements while navigating comics, animation, streaming, merchandising, creative collaboration, and the dangerous legal realities behind billion-dollar entertainment universes.$pitch$,
    false, true, false, true, true, true,
    '1wk', true, true,
    ARRAY['Contracts','Copyright','Trademark']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/big-entertainment-presents-neil-gaimans-mr-hero-1.png', NULL, NULL,
    29.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'NEIL GAIMAN''S MR. HERO PROJECT' AND professor_id = john_professor_id);

  -- ─── Project 4: THAT'S EATER-TAINMENT ──────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    $title$THAT'S EATER-TAINMENT: FRANK & DINO's ITALIAN RESTAURANT$title$,
    'Dead Celebrities. Live Lawsuits. Huge Profits.',
    $pitch$THAT'S EAT-ERTAINMENT transforms a glamorous Boca Raton Rat Pack restaurant into a legal minefield involving Frank Sinatra, Dean Martin, Sammy Davis Jr., publicity rights, trademark law, copyright licensing, music usage, memorabilia, branding, and the economics of nostalgia. Students are hired as entertainment counsel to a booming restaurant chain accused of cashing in on dead celebrity identities without permission. The deeper they dig, the uglier—and more fascinating—the business realities become. This project forces students to confront one of entertainment law's hardest truths: sometimes the entire business model is built on borrowed fame. Behind the velvet ropes, candlelight, and martinis sits a brutal legal question: where does homage end and infringement begin?$pitch$,
    false, true, false, true, true, true,
    '1wk', true, true,
    ARRAY['Copyright','Trademark','Business Associations','Entertainment Law']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/thats-eatertainment-frank-and-dinos-italian-restaurant-1.png', NULL, NULL,
    49.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = $title$THAT'S EATER-TAINMENT: FRANK & DINO's ITALIAN RESTAURANT$title$ AND professor_id = john_professor_id);

  -- ─── Project 5: FRUIT FIGHT 1 ──────────────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'FRUIT FIGHT 1: The Battle of Valencia',
    'Lie. Cheat. Steal. Manipulate. Repeat.',
    $pitch$Drop your students into a no-escape, high-stakes negotiation where only 10,000 oranges exist—and both sides need them all. In Fruit Fight: The Battle of Valencia, students weaponize leverage, deception, empathy, and deal structure under a ruthless "Fill or Kill" clock. One side is saving children from cancer; the other is launching a viral, multi-million-dollar product. There is no mediator. No delay. Just outcome. In 30 minutes, you will surface every negotiation instinct—ethics, strategy, pressure, and creativity. This isn't theory. This is how deals actually get done.$pitch$,
    true, false, false, false, false, true,
    '1hr', false, false,
    ARRAY['Negotiation']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/fruit-fight-1-the-battle-of-valencia-main-title-card-1.png', NULL, NULL,
    29.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'FRUIT FIGHT 1: The Battle of Valencia' AND professor_id = john_professor_id);

  -- ─── Project 6: NERF NATION ARENA ──────────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'NERF NATION ARENA INVESTMENT OPPORTUNITY',
    'HEROES WANTED.',
    $pitch$NERF NATION ARENA turns a fast-growing foam-blaster entertainment league into a high-stakes securities and business-law crisis where the real danger is not the game — it is raising money illegally. Built around the explosive growth of a fictional competitive entertainment startup, the project forces students to navigate private placements, investor solicitation rules, securities exemptions, sponsorship deals, liability exposure, corporate structure, influencer marketing, and the razor-thin line between aggressive fundraising and securities fraud. Students must advise founders desperate to scale quickly without triggering catastrophic SEC attention. This project transforms startup hype, entertainment culture, and entrepreneurial ambition into a brutally realistic exercise in modern capital investment law and securities.$pitch$,
    false, true, false, true, true, true,
    '1wk', true, true,
    ARRAY['Securities Regulation','Entertainment Law','Trademark','Copyright']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/nerf-nation-arena-image-1.png',
    '/images/projects/projects-upload/nerf-nation-arena-image-2.png',
    NULL,
    99.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'NERF NATION ARENA INVESTMENT OPPORTUNITY' AND professor_id = john_professor_id);

  -- ─── Project 7: OH! WHAT A FIGHT ───────────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'OH! WHAT A FIGHT…',
    '…One Way or Another, Everybody Wants a Piece',
    $pitch$OH WHAT A FIGHT transforms copyright law, music licensing, sampling, and derivative works into a globe-spanning entertainment industry war involving Flo Rida, The Four Seasons, French pop icon Claude François, viral EDM remixes, and a mysterious masked DJ known as MOON MAN. Built like a real client emergency, the project forces students to untangle overlapping ownership claims, international licensing disputes, mechanical licenses, sound recording rights, and modern remix culture while advising a celebrity client facing multiple lawsuits. This is not abstract copyright theory hidden inside appellate opinions. It is the modern music business operating exactly where law, money, fame, streaming culture, and commercial exploitation violently collide.$pitch$,
    false, true, false, true, true, true,
    '1wk', true, true,
    ARRAY['Copyright','Entertainment Law']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/oh-what-a-fight-1.png', NULL, NULL,
    49.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'OH! WHAT A FIGHT…' AND professor_id = john_professor_id);

  -- ─── Project 8: ZOOM SUIT ──────────────────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'ZOOM SUIT: Graphic Novel Work-for-Hire Agreements',
    'If the Suit Fits Wear It!',
    $pitch$Based on a REAL comic book property published through Diamond Comics, ZOOM SUIT: The Work For Hire Agreement Project turns students into entertainment lawyers protecting a multimedia franchise from future ownership wars. Using Aalmuhammed v. Lee, students draft a real-world Work For Hire Agreement involving comics, animation, streaming, merchandising, freelancers, and legendary comic creators.$pitch$,
    false, true, false, true, false, false,
    '3hr', true, true,
    ARRAY['Contracts']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/zoom-suit-work-for-hire-image-1.png', NULL, NULL,
    29.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'ZOOM SUIT: Graphic Novel Work-for-Hire Agreements' AND professor_id = john_professor_id);

  -- ─── Project 9: PUBLIC HUMILIATION (renamed) ───────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'PUBLIC HUMILIATION: Mike Roddick Has Two Small Problems',
    'Now Mike Roddick has a TWO Small Problems…',
    $pitch$Michael "Mike" Roddick built Mike's Discount Video, Inc. into a surprisingly huge business selling public-domain movies at very small prices. Then one tiny cease-and-desist letter created one enormous problem: apparently some films can be public domain—without actually being "free." Now Mike has an even bigger idea. Trading cards. Shirts. Mugs. Posters. Merchandise built from It's a Wonderful Life, Night of the Living Dead, and the Superman Fleischer Cartoons. Unfortunately for Mike, every one of those films carries surviving rights somewhere above, below, or inside the work itself. Poor Mike. Now Mike Roddick has TWO small problems.$pitch$,
    false, true, false, true, true, false,
    '1wk', false, true,
    ARRAY['Copyright']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/public-humiliation-mikes-discount-video-1.png',
    '/images/projects/projects-upload/public-humiliation-mikes-discount-video-2.png',
    '/images/projects/projects-upload/public-humiliation-mikes-discount-video-3.png',
    39.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'PUBLIC HUMILIATION: Mike Roddick Has Two Small Problems' AND professor_id = john_professor_id);

  -- ─── Project 10: WHO IS BRAINGASM-X?!!? ────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'WHO IS BRAINGASM-X?!!?',
    'He Took their Characters. Is he a Villain…or a Vigilante?',
    $pitch$WHO IS BRAINGASM-X?!?!? throws students into a Supreme Court–level collision between parody, copyright, fair use, comics, politics, and pop culture. Students must argue whether a provocative artist's superhero-inspired works are protected expression or actionable infringement — while navigating litigation strategy, media optics, and the brutal economics of modern IP warfare.$pitch$,
    true, true, true, true, true, false,
    '1wk', true, false,
    ARRAY['Copyright']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/who-is-braingasm-x-1.png',
    '/images/projects/projects-upload/who-is-braingasm-x.jpg',
    '/images/projects/projects-upload/who-is-braingasm-x-3.jpg',
    399.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'WHO IS BRAINGASM-X?!!?' AND professor_id = john_professor_id);

  -- ─── Project 11: FCM ONE ───────────────────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'FCM ONE: A FOREX TRADING PLATFORM',
    $tag$It's All Foreign (Currency) to Me.$tag$,
    $pitch$FCM ONE: It's All Foreign Currency to Me follows the launch of a high-risk online currency exchange startup built by one relentless founder working around the clock beside graduate students, coders, and quantitative analysts hired to translate massive financial formulas into functioning software under work-for-hire agreements. As the platform begins scaling internationally, the legal problems grow just as fast. Ownership of code, IP assignment, contractor classification, confidentiality, proprietary algorithms, and financial compliance collide inside a business where tiny formula errors can create enormous losses. The founder built the vision, funded the chaos, and pushed the project forward—but who actually owns the platform once everybody's code becomes part of the machine?$pitch$,
    false, true, false, true, false, false,
    '3hr', true, true,
    ARRAY['Contracts']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/fcm-one-programmers-work-for-hire-agreement-1.png', NULL, NULL,
    29.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'FCM ONE: A FOREX TRADING PLATFORM' AND professor_id = john_professor_id);

  -- ─── Project 12: CRAZY CUPS ────────────────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'CRAZY CUPS: CAN YOU PATENT A SILICONE CUP?',
    $tag$Who's Flexible?$tag$,
    $pitch$CRAZY CUPS claims it owns the patent rights to silicone drinkware and has begun threatening competitors, retailers, and manufacturers with lawsuits over flexible drinking cups. But does owning a patent mean owning an entire product category? This project forces students into the middle of a modern intellectual-property war involving patents, product design, manufacturing, marketing claims, licensing leverage, competition strategy, and the dangerous gap between legal reality and corporate intimidation. Students must determine whether CRAZY CUPS truly owns groundbreaking technology—or whether the company is using aggressive legal threats to scare an entire industry into submission.$pitch$,
    true, true, false, false, false, true,
    '1wk', true, true,
    ARRAY['Negotiation','Patents','Contracts']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/crazy-cups-can-you-patent-a-silicone-cup-1.png', NULL, NULL,
    49.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'CRAZY CUPS: CAN YOU PATENT A SILICONE CUP?' AND professor_id = john_professor_id);

  -- ─── Project 13: HE STOLE MY JORDANS ───────────────────────────────────────
  INSERT INTO public.projects (
    id, professor_id, title, tagline, pitch,
    versus, drafting, oral_argument, solo, team, creativity,
    duration, real_world, world_rank_qualifying,
    area_of_law, industries, tags,
    image_1_path, image_2_path, image_3_path,
    price
  )
  SELECT
    gen_random_uuid(), john_professor_id,
    'NIKE, INC. v. STREET ARTIST KOOL KIY',
    'Sneaker Culture Collides With Billion-Dollar Branding.',
    $pitch$Drop your students into the middle of a complete mess! A billion-dollar war between sneaker culture, street art, trademark law, trade dress, and corporate power. Based on a REAL federal lawsuit, students become outside counsel to street artist Kool Kiy, as they are forced to navigate infringement claims, consumer confusion, parody, trade dress, litigation strategy, Kiy's (awful) former law firm, and the dangerous gap between "inspired by" and unlawful copying. This is not abstract IP theory. This is modern brand warfare. Students must advise the client whether to fight Nike, settle, redesign, pivot, license, collaborate — or risk financial annihilation. Along the way, they confront one of the most uncomfortable realities in entertainment and branding law: sometimes the line between "artist" and "infringer" is worth millions of dollars.$pitch$,
    false, true, false, true, true, true,
    '1wk', true, true,
    ARRAY['Trademark','Copyright','Right of Publicity','Entertainment Law','Negotiation']::text[],
    '{}'::text[], '{}'::text[],
    '/images/projects/projects-upload/he-stole-my-jordans-nike-inc-v-kool-kiy-1.png',
    '/images/projects/projects-upload/he-stole-my-jordans-nike-inc-v-kool-kiy-2.png',
    NULL,
    49.99
  WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE title = 'NIKE, INC. v. STREET ARTIST KOOL KIY' AND professor_id = john_professor_id);

END $seed$;
