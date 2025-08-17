-- EWA Website Database Backup
-- Generated: 2025-08-17T06:28:19.367Z

-- Table: backup_metadata
DROP TABLE IF EXISTS "backup_metadata" CASCADE;
CREATE TABLE "backup_metadata" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "timestamp" timestamp with time zone DEFAULT now(),
  "backup_type" character varying NOT NULL,
  "file_url" text,
  "file_size" bigint,
  "duration_ms" integer,
  "status" character varying DEFAULT 'pending'::character varying,
  "error_message" text,
  "blob_count" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Data for backup_metadata
INSERT INTO "backup_metadata" VALUES
  ('f62947d2-12ea-480c-b8d3-d20c48486936', Wed Aug 06 2025 20:33:02 GMT-0700 (Pacific Daylight Time), 'full', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/db-backup-2025-08-07T03-33-02-781Z', '1367866', 8454, 'success', NULL, 0, Wed Aug 06 2025 20:33:02 GMT-0700 (Pacific Daylight Time)),
  ('4c5e4801-3bf5-4a0e-8af5-0e4330fc5450', Thu Aug 07 2025 10:53:01 GMT-0700 (Pacific Daylight Time), 'full', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/db-backup-2025-08-07T17-53-01-939Z', '2720045', 4526, 'success', NULL, 0, Thu Aug 07 2025 10:53:01 GMT-0700 (Pacific Daylight Time)),
  ('5c582152-f5a5-41b2-9b28-bd1cac88da2b', Thu Aug 07 2025 10:57:46 GMT-0700 (Pacific Daylight Time), 'full', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/db-backup-2025-08-07T17-57-46-450Z', '5424029', 5260, 'success', NULL, 0, Thu Aug 07 2025 10:57:46 GMT-0700 (Pacific Daylight Time)),
  ('52553884-4a17-4af9-a34a-90305399d2f0', Thu Aug 07 2025 10:58:30 GMT-0700 (Pacific Daylight Time), 'full', NULL, NULL, NULL, 'failed', 'Vercel Blob: Access denied, please provide a valid token for this resource.', 0, Thu Aug 07 2025 10:58:30 GMT-0700 (Pacific Daylight Time)),
  ('3770b7f3-4e93-4394-bb76-08b908af28fb', Thu Aug 07 2025 10:58:59 GMT-0700 (Pacific Daylight Time), 'full', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/db-backup-2025-08-07T17-58-59-180Z', '10832191', 5139, 'success', NULL, 0, Thu Aug 07 2025 10:58:59 GMT-0700 (Pacific Daylight Time)),
  ('fe600a94-3ef1-4f93-95a7-b6182dd248f4', Thu Aug 07 2025 11:01:28 GMT-0700 (Pacific Daylight Time), 'full', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/db-backup-2025-08-07T18-01-28-261Z', '21649030', 6282, 'success', NULL, 0, Thu Aug 07 2025 11:01:28 GMT-0700 (Pacific Daylight Time)),
  ('a67da8e7-5b3b-44a7-bd4a-ae6abb583efb', Tue Aug 12 2025 00:42:02 GMT-0700 (Pacific Daylight Time), 'full', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/db-backup-2025-08-12T07-42-03-377Z', '44430327', 13188, 'success', NULL, 0, Tue Aug 12 2025 00:42:03 GMT-0700 (Pacific Daylight Time)),
  ('73ecd2cd-8772-48c5-9090-5e418a38248c', Tue Aug 12 2025 23:49:25 GMT-0700 (Pacific Daylight Time), 'full', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/db-backup-2025-08-13T06-49-26-006Z', '88880552', 15114, 'success', NULL, 0, Tue Aug 12 2025 23:49:25 GMT-0700 (Pacific Daylight Time)),
  ('e2b58c86-142b-4f3b-88e9-fa78ddc0fc74', Wed Aug 13 2025 00:20:05 GMT-0700 (Pacific Daylight Time), 'full', NULL, NULL, NULL, 'failed', 'Vercel Blob: No token found. Either configure the `BLOB_READ_WRITE_TOKEN` environment variable, or pass a `token` option to your calls.', 0, Wed Aug 13 2025 00:20:05 GMT-0700 (Pacific Daylight Time)),
  ('ef050853-2039-410b-af84-408ffa613ae5', Sat Aug 16 2025 12:07:58 GMT-0700 (Pacific Daylight Time), 'full', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/db-backup-2025-08-16T19-07-58-799Z', '177753648', 28236, 'success', NULL, 0, Sat Aug 16 2025 12:07:58 GMT-0700 (Pacific Daylight Time)),
  ('d1277e63-84b3-42c1-82dc-d148e09b2ea8', Sat Aug 16 2025 21:19:56 GMT-0700 (Pacific Daylight Time), 'full', NULL, NULL, NULL, 'pending', NULL, 0, Sat Aug 16 2025 21:19:56 GMT-0700 (Pacific Daylight Time)),
  ('88c12b1c-a241-4fd1-b86a-984beda109f9', Sat Aug 16 2025 21:20:15 GMT-0700 (Pacific Daylight Time), 'full', NULL, NULL, NULL, 'pending', NULL, 0, Sat Aug 16 2025 21:20:15 GMT-0700 (Pacific Daylight Time));

-- Table: backup_status
DROP TABLE IF EXISTS "backup_status" CASCADE;
CREATE TABLE "backup_status" (
  "id" integer NOT NULL DEFAULT 1,
  "last_backup" timestamp with time zone,
  "last_backup_status" character varying,
  "next_scheduled_backup" timestamp with time zone,
  "backup_count" integer DEFAULT 0,
  "total_backup_size" bigint DEFAULT 0,
  "updated_at" timestamp with time zone DEFAULT now()
);

-- Data for backup_status
INSERT INTO "backup_status" VALUES
  (1, Sat Aug 16 2025 12:07:58 GMT-0700 (Pacific Daylight Time), 'success', NULL, 8, '353057688', Sat Aug 16 2025 12:08:26 GMT-0700 (Pacific Daylight Time));

-- Table: booster_clubs
DROP TABLE IF EXISTS "booster_clubs" CASCADE;
CREATE TABLE "booster_clubs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "description" text,
  "website_url" character varying,
  "donation_url" character varying,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "zelle_qr_code_path" character varying,
  "stripe_donation_link" character varying,
  "stripe_membership_link" character varying,
  "stripe_fees_link" character varying,
  "payment_instructions" text,
  "is_payment_enabled" boolean DEFAULT false,
  "last_payment_update_by" character varying,
  "last_payment_update_at" timestamp with time zone,
  "zelle_url" text,
  "qr_code_settings" jsonb DEFAULT '{"color": {"dark": "#000000", "light": "#FFFFFF"}, "width": 640, "margin": 2, "errorCorrectionLevel": "M"}'::jsonb,
  "stripe_url" character varying,
  "sort_order" integer DEFAULT 999
);

-- Data for booster_clubs
INSERT INTO "booster_clubs" VALUES
  ('1dcc6157-a3f6-46f3-a50f-23cde148b58b', 'Eastlake Girls Basketball Booster Club', 'The Eastlake Girls Basketball Booster Club is dedicated to supporting the girls'' basketball program at Eastlake High School. Our mission is to provide financial assistance, organize events, and build a strong community of supporters to ensure that our athletes have the best possible experience on and off the court. We strive to promote the values of teamwork, sportsmanship, and dedication, while enhancing the overall athletic experience for our players.', 'https://www.goladywolves.com/', 'payment.html?club=Eastlake%20Girls%20Basketball%20Booster%20Club', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:37:56 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgR0lSTFMgQkFTS0VUQkFMTCBCT09TVEVSIENMVUIiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlYXN0bGFrZWxhZHl3b2x2ZXNAZ21haWwuY29tIn0', [object Object], 'https://www.goladywolves.com/page/show/8862343-it-s-2024-25-season-donate-now', 4),
  ('40733b78-7d7c-44b8-a713-f5fbfb2ffefb', 'Eastlake Fastpitch (Girls)', 'The Eastlake Fastpitch Booster Club supports the girls'' fastpitch softball teams at Eastlake High School by providing resources, organizing events, and fostering a community of fans. Our mission is to enhance the athletic experience for players and promote the values of teamwork, sportsmanship, and dedication.', 'https://www.ehsfastpitch.org/', 'payment.html?club=Eastlake%20Fastpitch%20(Girls)', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 22:58:38 GMT-0700 (Pacific Daylight Time), NULL, [object Object], 'https://www.ehsfastpitch.org/donations', 11),
  ('e30ef488-f120-48b2-9f92-bf1ab60a3ccd', 'Eastlake Boys Golf Booster Club', 'The Eastlake Boys Golf Booster Club is committed to supporting the boys'' golf program at Eastlake High School. Our mission is to provide financial assistance, organize events, and foster a community of supporters to ensure that our golfers have the resources and opportunities to excel both on the course and in their personal development. We aim to promote the values of sportsmanship, discipline, and teamwork.', 'https://eastlakeboysgolf.org', 'payment.html?club=Eastlake%20Boys%20Golf%20Booster%20Club', true, Tue Aug 12 2025 12:53:19 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-boys-golf-booster-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:45:12 GMT-0700 (Pacific Daylight Time), NULL, [object Object], 'http://www.ehsboysgolf.com/', 12),
  ('2b5bfa51-bed6-49f6-aa3a-962e42549d52', 'Eastlake Robotics Club', 'The purpose of the Eastlake Robotics (Pack of Parts) Team 1294 shall be to promote science and technology in Eastlake High School and the surrounding community through student and community programs involving engineering and other technical skills.', 'https://www.packofparts.org/', 'payment.html?club=Eastlake%20Robotics%20Club', true, Tue Aug 12 2025 12:45:25 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:34:42 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgUk9CT1RJQ1MgQk9PU1RFUiBDTFVCIiwiYWN0aW9uIjoicGF5bWVudCIsInRva2VuIjoiNDI1NDQyOTA1OSJ9', [object Object], 'https://buy.stripe.com/3cIbJ2g7L0Y59KVeRxbQY02', 15),
  ('933845bd-6e1a-47e0-a3df-e3a7123b3260', 'Eastlake Girls Soccer', 'The Eastlake Girls Soccer Booster Club supports the girls'' soccer teams at Eastlake High School by providing resources, organizing events, and fostering a community of fans. Our mission is to enhance the athletic experience for players and promote the values of teamwork, sportsmanship, and dedication.', 'https://www.eastlakegirlssoccer.com/', 'payment.html?club=Eastlake%20Girls%20Soccer%20Booster%20Club', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:36:55 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgR0lSTFMgU09DQ0VSIiwiYWN0aW9uIjoicGF5bWVudCIsInRva2VuIjoidHJlYXN1cmVyQGVhc3RsYWtlZ2lybHNzb2NjZXIuY29tIn0', [object Object], 'https://www.eastlakegirlssoccer.com/donate', 17),
  ('4053c0cb-5959-4379-80f0-e82998225318', 'Eastlake Girls Swim & Dive Booster Club', 'The Eastlake Girls Swim & Dive Booster Club is dedicated to supporting the girls'' swim and dive teams at Eastlake High School. Our mission is to provide financial assistance, organize events, and foster a community of enthusiastic supporters to ensure that our athletes have the best possible experience in and out of the pool. We aim to promote the values of teamwork, sportsmanship, and dedication, helping our swimmers and divers achieve their personal and team goals.', 'https://ehswolvesswimdive.wixsite.com/home', 'payment.html?club=Eastlake%20Girls%20Swimming%20Booster%20Club', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, true, 'admin', Sat Aug 16 2025 19:52:16 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgR0lSTFMnIFNXSU0gQk9PU1RFUiBDTFVCIiwiYWN0aW9uIjoicGF5bWVudCIsInRva2VuIjoiZWhzZ2lybHNzd2l2ZUBnbWFpbC5jb20ifQ', [object Object], NULL, 19),
  ('f2efccc3-4dbe-4eeb-b65e-ba7e7149c740', 'Eastlake Wolfpack Association', 'The main Eastlake Wolfpack Association organization that coordinates all booster clubs and activities.', 'https://eastlakewolfpack.org', 'https://ewa-website.vercel.app/payment.html', true, Tue Aug 05 2025 17:37:57 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\ewa-eastlake-wolfpack-association-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:35:28 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiVGhlIEVhc3RsYWtlIFdvbGZwYWNrIEFzc29jaWF0aW9uIiwiYWN0aW9uIjoicGF5bWVudCIsInRva2VuIjoiZ2lybHNnb2xmdHJlYXN1cmVyQGdtYWlsLmNvbSJ', [object Object], NULL, 23),
  ('d2d3fcd3-822b-4466-bbd3-49d55c4fb0bd', 'Eastlake Cheer Booster Club', 'The Eastlake Cheer Booster Club supports the cheerleading teams at Eastlake High School by providing resources, organizing events, and fostering a community of fans. Our mission is to enhance the athletic experience for cheerleaders and promote the values of teamwork, sportsmanship, and dedication.', 'https://ehscheerboosterclub.ourschoolpages.com/Home', 'payment.html?club=Eastlake%20Cheer%20Booster%20Club', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:08:47 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-cheer-booster-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:38:29 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIENIRUVSIEJPT1NURVIgQ0xVQiIsImFjdGlvbiI6InBheW1lbnQiLCJ0b2tlbiI6ImVoc2NoZWVyX2Jvb3N0ZXJAb3V0bG9vay5jb20ifQ', [object Object], NULL, 5),
  ('40595908-c00e-4d87-a79a-566aa4869715', 'Eastlake Choir', 'The Eastlake Choir Booster Club is committed to supporting the choir program at Eastlake High School. Our mission is to enhance the musical experience for students by providing financial assistance, organizing events, and fostering a community of passionate supporters. We aim to ensure that every choir member has the resources and opportunities to excel in their vocal and musical journey, while promoting the values of creativity, collaboration, and dedication.', 'https://www.facebook.com/groups/1320268077989293/', 'payment.html?club=Eastlake%20Choir', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-choir-zelle.png', NULL, NULL, NULL, NULL, true, 'emergency-fix', Tue Aug 12 2025 16:38:14 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgQ0hPSVIiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiI0MjU0NDI5MDU5In0=', [object Object], NULL, 6),
  ('cfa44638-82d5-4d26-b5b3-d00f3b7cc428', 'Eastlake Dance Team Boosters', 'The Eastlake Dance Team Boosters is dedicated to supporting the dance team at Eastlake High School. We provide financial assistance, organize events, and build a strong community of supporters to ensure that our dancers have the best possible experience in their performances and competitions.', 'https://eastlakedanceteam.org', 'payment.html?club=Eastlake%20Dance%20Team%20Boosters', true, Tue Aug 12 2025 12:53:19 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-dance-team-boosters-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:39:20 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgREFOQ0UgVEVBTSBCT09TVEVSUyIsImFjdGlvbiI6InBheW1lbnQiLCJ0b2tlbiI6ImVoc2RhbmNldHJlYXN1cnlAZ21haWwuY29tIn0', [object Object], NULL, 8),
  ('77273cdf-390f-4611-ae8a-81c542e69def', 'Eastlake Girls Golf Booster Club', 'The Eastlake Girls Golf Booster Club is dedicated to supporting the girls'' golf program at Eastlake High School. We strive to provide financial support, organize events, and build a strong community of fans and supporters. Our goal is to enhance the athletic experience for our golfers, promoting values such as sportsmanship, discipline, and teamwork, while helping them achieve success both on and off the course.', 'https://eastlakegirlsgolf.org', 'payment.html?club=Eastlake%20Girls%20Golf%20Booster%20Club', true, Tue Aug 12 2025 12:53:19 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, true, 'admin', Sat Aug 16 2025 21:32:22 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiVGhlIEVhc3RsYWtlIFdvbGZwYWNrIEFzc29jaWF0aW9uIiwiYWN0aW9uIjoicGF5bWVudCIsInRva2VuIjoiZ2lybHNnb2xmdHJlYXN1cmVyQGdtYWlsLmNvbSJ9', [object Object], NULL, 13),
  ('47d6a7c1-128d-4719-b002-ae34d9012619', 'Eastlake Boys Soccer', 'The Eastlake Boys Soccer Booster Club supports the boys'' soccer teams at Eastlake High School by providing resources, organizing events, and fostering a community of fans. Our mission is to enhance the athletic experience for players and promote the values of teamwork, sportsmanship, and dedication.', 'http://eastlakewolvesboyssoccer.com/index.html', 'payment.html?club=Eastlake%20Boys%20Soccer%20Booster%20Club', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-boys-soccer-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:39:42 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIEJPWVMgU09DQ0VSIiwiYWN0aW9uIjoicGF5bWVudCIsInRva2VuIjoiZWhzYm95c29jY2VyQG91dGxvb2suY29tIn0', [object Object], NULL, 16),
  ('4d60931c-5c2a-47d2-ae4a-e37192294f7e', 'Eastlake Boys Swim & Dive Booster Club', 'The Eastlake Boys Swim & Dive Booster Club is committed to supporting the swim and dive teams at Eastlake High School. We provide financial assistance, organize events, and build a strong community of supporters to ensure that our athletes have the best possible experience in and out of the pool.', 'https://ehswolvesswimdive.wixsite.com/home', 'payment.html?club=Eastlake%20Boys%20Swimming%20Booster%20Club', true, Tue Aug 05 2025 17:22:54 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-boys-swim---dive-booster-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:37:19 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIEJPWVMgU1dJTSAmIERJVkUgQk9PU1RFUiBDTFVCIiwiYWN0aW9uIjoicGF5bWVudCIsInRva2VuIjoiZWhzYm95c3N3aXZlQGdtYWlsLmNvbSJ9', [object Object], NULL, 18),
  ('b926f783-1f1e-41ae-a94a-fdccac50e3f8', 'Eastlake Volleyball Booster Club', 'The Eastlake Volleyball Booster Club is dedicated to supporting the volleyball program at Eastlake High School. We provide financial assistance, organize events, and build a strong community of supporters to ensure that our athletes have the best possible experience on and off the court.', 'https://www.eastlakevolleyball.net/', 'payment.html?club=Eastlake%20Volleyball%20Booster%20Club', true, Tue Aug 05 2025 17:22:54 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:35:48 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgVk9MTEVZQkFMTCBCT09TVEVSIENMVUIiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHN2YmFsbEBob3RtYWlsLmNvbSJ9', [object Object], NULL, 21),
  ('5b09a2d8-a942-473d-9270-49f13c1b36c3', 'Eastlake Wrestling Booster Club', 'The EHS Wrestling Booster Club supports the wrestling teams at Eastlake High School by providing resources, organizing events, and fostering a community of fans. Our mission is to enhance the athletic experience for wrestlers and promote the values of teamwork, sportsmanship, and dedication.', 'https://eastlakewolveswrestling.com/', 'payment.html?club=Eastlake%20Wrestling%20Booster%20Club', true, Tue Aug 05 2025 17:22:54 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\ehs-wrestling-booster-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:34:21 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIFdSRVNUTElORyBCT09TVEVSIENMVUIiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHN3cmVzdGxlQGxpdmUuY29tIn0', [object Object], 'https://buy.stripe.com/28EfZh9b71yg7JJ8gA8AE02', 22),
  ('fb289ef9-3f94-4145-b1df-55fafd4362cb', 'Eastlake Drama', 'The Eastlake Drama Booster Club supports the drama program at Eastlake High School by providing resources, organizing events, and fostering a community of fans. Our mission is to enhance the theatrical experience for students and promote the values of creativity, collaboration, and dedication.', 'https://eastlakedrama.org/', 'payment.html?club=Eastlake%20Drama', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-drama-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Sat Aug 16 2025 21:28:31 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRWFzdGxha2UgRHJhbWEgQm9vc3RlciBDbHViIiwiYWN0aW9uIjoicGF5bWVudCIsInRva2VuIjoiYm9vc3RlcnNAZWFzdGxha2VkcmFtYS5vcmcifQ', [object Object], 'https://buy.stripe.com/dR64jT65B6OYfMQ3cc', 10),
  ('99367bd3-c24a-42cd-b581-35f36a29ef49', 'Eastlake Baseball Club', 'The Eastlake Baseball Club supports the Eastlake High School baseball teams by providing resources, organizing events, and fostering a community of fans and supporters. Our goal is to enhance the athletic experience for players and promote the values of teamwork, sportsmanship, and dedication.', 'https://www.eastlakewolvesbaseball.com/', 'payment.html?club=Eastlake%20Baseball%20Club', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-baseball-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:38:53 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgQkFTRUJBTEwgQ0xVQiIsImFjdGlvbiI6InBheW1lbnQiLCJ0b2tlbiI6InRyZWFzdXJlckBlYXN0bGFrZXdvbHZlc2Jhc2ViYWxsLmNvbSJ9', [object Object], 'https://www.eastlakewolvesbaseball.com/donate', 2),
  ('05d21d4b-4149-4b7f-9e20-dfa3864f60dd', 'Eastlake Orchestra Boosters Club', 'The EHS Orchestra Boosters Club is dedicated to supporting the Eastlake High School orchestra program. Our mission is to enhance the musical experience for students by providing financial support, organizing events, and fostering a community of enthusiastic supporters. We aim to ensure that every orchestra member has the resources and opportunities to excel in their musical journey.', 'https://ehs.lwsd.org/activities/clubs', 'payment.html?club=Eastlake%20Orchestra%20Booster%20Club', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\ehs-orchestra-boosters-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Sat Aug 16 2025 20:16:15 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIE9SQ0hFU1RSQSBCT09TVEVSIENMVUIiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHNvcmNoZXN0cmFzQG91dGxvb2suY29tIn0', [object Object], 'https://buy.stripe.com/aFa14meoS3Mseit5j3f3a00', 14),
  ('a79fec5c-ffbc-4fd2-832f-ddf09019d392', 'Eastlake DECA Booster Club', 'The EHS DECA Booster Club is committed to supporting the DECA program at Eastlake High School. We provide financial assistance, organize events, and build a strong community of supporters to ensure that our students have the best possible experience in developing their business and leadership skills.', 'https://eastlakedeca.wordpress.com/', 'payment.html?club=EHS%20DECA%20Booster%20Club', true, Tue Aug 12 2025 12:53:19 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:19:49 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\ehs-deca-booster-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:47:12 GMT-0700 (Pacific Daylight Time), NULL, [object Object], 'https://eastlakedeca.wordpress.com/', 9),
  ('5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'Eastlake Band Boosters', 'The EHS Band Boosters is dedicated to supporting the Eastlake High School band program. Our mission is to enhance the musical experience for students by providing financial support, organizing events, and fostering a community of enthusiastic supporters. We aim to ensure that every band member has the resources and opportunities to excel in their musical journey.', 'https://www.facebook.com/groups/EHSmusicboosters', 'payment.html?club=EHS%20Band%20Boosters', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\ehs-band-boosters-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:42:32 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIEJBTkQgQk9PU1RFUlMiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHNiYW5kYm9vc3RlcnN0cmVhc3VyZXJAb3V0bG9vay5jb20ifQ', [object Object], 'https://buy.stripe.com/bJe7sKdJu3dM6UZ0Dy1sQ00', 1),
  ('bc3e4b83-e9a7-47ca-b7a9-56e1b4843f66', 'Eastlake Boys Basketball Booster Club', 'The Eastlake Boys Basketball Booster Club is dedicated to supporting the boys'' basketball program at Eastlake High School. We provide financial assistance, organize events, and build a strong community of supporters to ensure that our athletes have the best possible experience on and off the court.', 'https://www.eastlakebasketball.com/', 'payment.html?club=Eastlake%20Boys%20Basketball%20Booster%20Club', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-boys-basketball-booster-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:43:34 GMT-0700 (Pacific Daylight Time), NULL, [object Object], 'https://www.eastlakebasketball.com/home', 3),
  ('ce376909-2bb7-402e-874a-3f542463602a', 'Eastlake Cross-Country Boosters', 'The Eastlake Cross-Country Boosters support the cross-country teams at Eastlake High School by providing resources, organizing events, and fostering a community of fans. Our mission is to enhance the athletic experience for runners and promote the values of teamwork, sportsmanship, and dedication.', 'https://wolvesxc.com/Home', 'payment.html?club=Eastlake%20Cross-Country%20Boosters', true, Tue Aug 05 2025 17:22:53 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\eastlake-cross-country-boosters-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:36:13 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgVFJBQ0sgQU5EIEZJRUxEIEJPT1NURVIgQ0xVQiIsImFjdGlvbiI6InBheW1lbnQiLCJ0b2tlbiI6ImVhc3RsYWtld29sdmVzdGZAZ21haWwuY29tIn0', [object Object], 'https://wolvesxc.com/Home', 7),
  ('6e69b02b-e467-4879-a7ba-16429e651a53', 'Eastlake Track and Field Booster Club', 'The EHS Track and Field Booster Club supports the track and field teams at Eastlake High School by providing resources, organizing events, and fostering a community of fans. Our mission is to enhance the athletic experience for athletes and promote the values of teamwork, sportsmanship, and dedication.', 'https://wolvesxc.com/Home', 'payment.html?club=Eastlake%20Track%20%26%20Field%20Booster%20Club', true, Tue Aug 05 2025 17:22:54 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 21:06:03 GMT-0700 (Pacific Daylight Time), 'zelle-standardized\ehs-track-and-field-booster-club-zelle.png', NULL, NULL, NULL, NULL, true, 'admin', Tue Aug 12 2025 23:36:25 GMT-0700 (Pacific Daylight Time), 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgVFJBQ0sgQU5EIEZJRUxEIEJPT1NURVIgQ0xVQiIsImFjdGlvbiI6InBheW1lbnQiLCJ0b2tlbiI6ImVhc3RsYWtld29sdmVzdGZAZ21haWwuY29tIn0', [object Object], 'https://wolvesxc.com/Home', 20);

-- Table: documents
DROP TABLE IF EXISTS "documents" CASCADE;
CREATE TABLE "documents" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "filename" character varying NOT NULL,
  "original_name" character varying NOT NULL,
  "blob_url" character varying NOT NULL,
  "file_size" integer,
  "mime_type" character varying,
  "booster_club" character varying NOT NULL,
  "uploaded_by" character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "club_id" uuid
);

-- Table: form_1099
DROP TABLE IF EXISTS "form_1099" CASCADE;
CREATE TABLE "form_1099" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "recipient_name" character varying NOT NULL,
  "recipient_tin" character varying,
  "amount" numeric NOT NULL,
  "description" text,
  "submitted_by" character varying,
  "tax_year" integer NOT NULL,
  "status" character varying DEFAULT 'pending'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "w9_filename" character varying,
  "w9_blob_url" character varying,
  "w9_file_size" integer,
  "w9_mime_type" character varying,
  "booster_club" character varying,
  "club_id" uuid
);

-- Data for form_1099
INSERT INTO "form_1099" VALUES
  ('17aeb0ac-1d13-4a26-9ff0-cfdc942b5410', 'Jim smith', '231-322-1111', '600.00', 'test', 'admin', 2024, 'pending', Tue Aug 05 2025 15:33:13 GMT-0700 (Pacific Daylight Time), Tue Aug 05 2025 19:09:27 GMT-0700 (Pacific Daylight Time), 'w9-1754433192899-StevenSmith.pdf', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/w9-1754433192899-StevenSmith.pdf', 220037, 'application/pdf', 'Eastlake Girls Soccer', NULL),
  ('427847f8-ee67-4d5e-b1c6-e5e39770457a', 'James smith', '555-55-5555', '600.00', 'Test of submission', 'admin', 2024, 'pending', Tue Aug 05 2025 15:36:21 GMT-0700 (Pacific Daylight Time), Tue Aug 05 2025 19:09:32 GMT-0700 (Pacific Daylight Time), 'w9-1754433380469-StevenSmith.pdf', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/w9-1754433380469-StevenSmith.pdf', 220037, 'application/pdf', 'Eastlake Boys Swim & Dive Booster Club', NULL),
  ('f9be3e93-b19a-492f-84d0-7e8d5fb94852', 'Andrew Smith', '350-55-5217', '50.00', 'test', 'admin', 2024, 'pending', Tue Aug 05 2025 15:40:17 GMT-0700 (Pacific Daylight Time), Tue Aug 05 2025 19:09:38 GMT-0700 (Pacific Daylight Time), 'w9-1754433616026-StevenSmith.pdf', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/w9-1754433616026-StevenSmith.pdf', 220037, 'application/pdf', 'EHS Orchestra Boosters Club', NULL),
  ('4965190c-b2aa-4d76-b7b1-5ebef02a0779', 'Test Vendor 2', '987-65-4321', '250.00', 'Test service 2', 'admin', 2024, 'acknowledged', Tue Aug 05 2025 14:42:28 GMT-0700 (Pacific Daylight Time), Tue Aug 05 2025 19:09:49 GMT-0700 (Pacific Daylight Time), 'test2.pdf', 'https://test.com/test2.pdf', 2048, 'application/pdf', 'Eastlake Boys Golf Booster Club', NULL),
  ('45e08cfa-5453-495e-aafe-e645cec01b18', 'Steven smith', '555-55-5555', '100.00', 'Consulting', 'admin', 2024, 'submitted_to_irs', Tue Aug 05 2025 15:20:21 GMT-0700 (Pacific Daylight Time), Tue Aug 05 2025 19:09:51 GMT-0700 (Pacific Daylight Time), 'w9-1754432419458-StevenSmith.pdf', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/w9-1754432419458-StevenSmith.pdf', 220037, 'application/pdf', 'Eastlake Girls Soccer', NULL),
  ('4a6c2392-65c3-4015-9459-3b45bed1369a', 'John Stevens', '555-55-5555', '1000.00', '', 'admin', 2025, 'pending', Wed Aug 06 2025 10:32:39 GMT-0700 (Pacific Daylight Time), Wed Aug 06 2025 10:32:39 GMT-0700 (Pacific Daylight Time), 'w9-1754501558027-StevenSmith.pdf', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/w9-1754501558027-StevenSmith.pdf', 220037, 'application/pdf', 'Eastlake Choir', NULL),
  ('8a64bc55-c594-470c-89a1-4a74658861fb', 'John Smith', '123-45-6789', '1500.00', 'Website development services', NULL, 2024, 'pending', Mon Jan 15 2024 02:30:00 GMT-0800 (Pacific Standard Time), Wed Aug 06 2025 17:42:16 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, NULL),
  ('212e2619-ff86-4572-85b9-5e6d60b83bfd', 'Sarah Johnson', '987-65-4321', '2500.00', 'Graphic design and marketing materials', NULL, 2024, 'acknowledged', Sat Jan 20 2024 06:15:00 GMT-0800 (Pacific Standard Time), Wed Aug 06 2025 17:42:16 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, NULL, NULL),
  ('0bf49073-024b-4b7e-90df-832cd83ea5e6', 'Joseph Smith', '555-55-5555', '1000.00', 'gold plates', 'admin', 2024, 'pending', Wed Aug 06 2025 18:36:54 GMT-0700 (Pacific Daylight Time), Wed Aug 06 2025 18:36:54 GMT-0700 (Pacific Daylight Time), 'w9-1754530611450-StevenSmith.pdf', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/w9-1754530611450-StevenSmith.pdf', 220037, 'application/pdf', 'EHS DECA Booster Club', NULL),
  ('db5f03e6-70b3-41e2-a206-a5f9c4d9c85b', 'Mike Wilson', '456-78-9012', '500.00', 'Equipment maintenance', NULL, 2024, 'submitted_to_irs', Wed Jan 10 2024 00:20:00 GMT-0800 (Pacific Standard Time), Fri Aug 08 2025 16:39:43 GMT-0700 (Pacific Daylight Time), NULL, NULL, NULL, NULL, 'Eastlake Boys Golf Booster Club', NULL),
  ('c7ec025d-01ea-405e-9021-32d9fb0bd479', 'John Smith', '555-55-5555', '100.00', 'Test of 1099', 'admin', 2024, 'pending', Mon Aug 11 2025 21:41:43 GMT-0700 (Pacific Daylight Time), Mon Aug 11 2025 21:41:43 GMT-0700 (Pacific Daylight Time), 'w9-1754973702326-d0e97453f5db476b92807b2345d3ec44_1.-AY26-27_HSSP_Applicant_Guide-Signed.pdf', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/w9-1754973702326-d0e97453f5db476b92807b2345d3ec44_1.-AY26-27_HSSP_Applicant_Guide-Signed.pdf', 606987, 'application/pdf', 'Eastlake Fastpitch (Girls)', NULL),
  ('84278a86-7ed7-4202-bc03-6c69dacd7b7e', 'Mike Stevens', '555-55-5555', '2.00', '', 'admin', 2024, 'acknowledged', Fri Aug 08 2025 16:40:35 GMT-0700 (Pacific Daylight Time), Mon Aug 11 2025 21:41:52 GMT-0700 (Pacific Daylight Time), 'w9-1754696434174-d0e97453f5db476b92807b2345d3ec44_1.-AY26-27_HSSP_Applicant_Guide-Signed.pdf', 'https://kre9xoivjggj03of.public.blob.vercel-storage.com/w9-1754696434174-d0e97453f5db476b92807b2345d3ec44_1.-AY26-27_HSSP_Applicant_Guide-Signed.pdf', 606987, 'application/pdf', 'Eastlake Baseball Club', NULL);

-- Table: insurance_forms
DROP TABLE IF EXISTS "insurance_forms" CASCADE;
CREATE TABLE "insurance_forms" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "event_name" character varying NOT NULL,
  "event_date" date NOT NULL,
  "event_description" text,
  "participant_count" integer,
  "submitted_by" character varying,
  "status" character varying DEFAULT 'pending'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "club_id" uuid
);

-- Data for insurance_forms
INSERT INTO "insurance_forms" VALUES
  ('7467e6eb-d388-4a79-8523-16957f9f61b3', 'Test Event', Wed Dec 25 2024 00:00:00 GMT-0800 (Pacific Standard Time), 'Test description', 10, 'admin', 'pending', Tue Aug 12 2025 11:40:47 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 11:40:47 GMT-0700 (Pacific Daylight Time), '5c5d9238-dc96-4ad0-b6fe-6282b06573bc'),
  ('9fa1d9e5-ac65-4f17-a1a3-9bff46bca3b6', 'Test Event', Wed Dec 25 2024 00:00:00 GMT-0800 (Pacific Standard Time), 'Test insurance event', 50, 'admin', 'pending', Tue Aug 12 2025 13:19:32 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 13:19:32 GMT-0700 (Pacific Daylight Time), NULL);

-- Table: links
DROP TABLE IF EXISTS "links" CASCADE;
CREATE TABLE "links" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "title" character varying NOT NULL,
  "url" character varying NOT NULL,
  "category" character varying DEFAULT 'other'::character varying,
  "order_index" integer DEFAULT 0,
  "is_visible" boolean DEFAULT true,
  "click_count" integer DEFAULT 0,
  "created_by" character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Data for links
INSERT INTO "links" VALUES
  ('9908875b-3a2e-4409-b077-1335f4a96d4c', 'Booster Club Guidelines', 'https://www.boosterspark.com/learn/a/what-are-the-irs-rules-for-booster-clubs-89', 'booster', 0, true, 3, 'admin', Tue Aug 12 2025 11:55:52 GMT-0700 (Pacific Daylight Time), Wed Aug 13 2025 13:36:58 GMT-0700 (Pacific Daylight Time)),
  ('841b1fc9-da42-41ef-bfca-9b4dbfaf880b', 'Eastlake Athletics', 'https://www.lwsd.org/schools/eastlake/athletics', 'athletics', 1, true, 0, 'admin', Tue Aug 12 2025 11:55:51 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 11:55:51 GMT-0700 (Pacific Daylight Time)),
  ('d7739d9f-0416-4dd8-8c6e-b7c0cf93a9b7', 'Eastlake High School', 'https://www.lwsd.org/schools/eastlake', 'community', 4, true, 0, 'admin', Tue Aug 12 2025 11:55:52 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 11:55:52 GMT-0700 (Pacific Daylight Time)),
  ('f7245e42-42a1-4e6f-aadd-44909038e912', 'WIAA', 'https://www.wiaa.com', 'athletics', 6, true, 0, 'admin', Tue Aug 12 2025 11:55:52 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 11:55:52 GMT-0700 (Pacific Daylight Time)),
  ('625a4b87-3758-407c-962a-5021b77dc2fe', 'Booster Club Insurance Questionairre & Info', 'https://uwh6nty2xca4bs7u.public.blob.vercel-storage.com/EWA-Insurance%20Questionairre.docx"     download="EWA-Insurance-Questionnaire.docx"    class="download-link"', 'booster', 0, true, 2, 'admin', Wed Aug 13 2025 13:51:24 GMT-0700 (Pacific Daylight Time), Wed Aug 13 2025 13:52:29 GMT-0700 (Pacific Daylight Time)),
  ('644a7289-50e8-41c1-9f1a-5d4684ca024a', 'Booster Treasurers Monthly Checklist', 'https://uwh6nty2xca4bs7u.public.blob.vercel-storage.com/Booster%20Treasurers%20Monthly%20Checklist.pdf" download="Booster Treasurers Monthly Checklist.pdf', 'booster', 0, true, 2, 'admin', Wed Aug 13 2025 14:19:39 GMT-0700 (Pacific Daylight Time), Wed Aug 13 2025 14:19:39 GMT-0700 (Pacific Daylight Time)),
  ('1a3d20fd-eab1-4622-a1b0-66eabae49fd7', 'LWSD Athletics', 'https://www.lwsd.org/athletics', 'athletics', 2, true, 1, 'admin', Tue Aug 12 2025 11:55:52 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 11:55:52 GMT-0700 (Pacific Daylight Time)),
  ('e8105a2a-e4d0-4784-b937-0e9683d5e7ab', 'Title IX Information for WIAA Sports', 'https://www.wiaawssaaatoolbox.com/title-ix-compliance.html', 'athletics', 0, true, 1, 'admin', Tue Aug 12 2025 20:32:34 GMT-0700 (Pacific Daylight Time), Wed Aug 13 2025 13:37:37 GMT-0700 (Pacific Daylight Time)),
  ('8296922e-86ce-4311-8172-5df8f4076b20', 'LWSD Insurance Requirements', 'https://www.lwsd.org/services/facilities/building-use/insurance-requirements', 'booster', 0, true, 5, 'admin', Wed Aug 13 2025 13:35:59 GMT-0700 (Pacific Daylight Time), Wed Aug 13 2025 13:39:14 GMT-0700 (Pacific Daylight Time)),
  ('ed9b8a32-6277-4601-9be7-74fe124aa8bf', 'LWSD Volunteer Application', 'https://www.lwsd.org/get-involved/volunteering-in-lwsd', 'community', 0, true, 0, 'admin', Wed Aug 13 2025 14:15:34 GMT-0700 (Pacific Daylight Time), Wed Aug 13 2025 14:15:34 GMT-0700 (Pacific Daylight Time)),
  ('c872d055-e0da-4bcc-97fc-0ff40d443aac', 'Wolfpack Booster Club Basics', 'https://uwh6nty2xca4bs7u.public.blob.vercel-storage.com/Wolfpack%20Basics%20October%202025.pdf" download="Wolfpack Basics October 2025.pdf"', 'booster', 0, true, 2, 'admin', Wed Aug 13 2025 14:14:22 GMT-0700 (Pacific Daylight Time), Wed Aug 13 2025 14:14:22 GMT-0700 (Pacific Daylight Time));

-- Table: news
DROP TABLE IF EXISTS "news" CASCADE;
CREATE TABLE "news" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "title" character varying NOT NULL,
  "content" text NOT NULL,
  "slug" character varying,
  "status" character varying DEFAULT 'draft'::character varying,
  "published_at" timestamp with time zone,
  "created_by" character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Data for news
INSERT INTO "news" VALUES
  ('f5e30feb-48fd-45af-8436-b61ee56828d0', 'Updated Test News Article', 'This is the updated content for the test news article.', 'test-news-article', 'published', NULL, 'admin', Tue Aug 12 2025 11:33:48 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 11:33:53 GMT-0700 (Pacific Daylight Time));

-- Table: officers
DROP TABLE IF EXISTS "officers" CASCADE;
CREATE TABLE "officers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying NOT NULL,
  "position" character varying NOT NULL,
  "email" character varying,
  "phone" character varying,
  "club" character varying NOT NULL,
  "club_name" character varying NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "club_id" uuid
);

-- Data for officers
INSERT INTO "officers" VALUES
  ('231340ba-03bc-481a-8d78-b02edf55f1c4', 'Sara Goldie', 'Athletic Director', 'sgoldie@lwsd.org', '000-000-0000', 'ewa', 'EWA Eastlake Wolfpack Association', Tue Aug 05 2025 12:59:15 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 15:52:18 GMT-0700 (Pacific Daylight Time), 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740'),
  ('c5238559-9ca5-4078-a156-4542217a855d', 'Todd Johnson', 'Concessions / Merch', 'todd.johnson@marzogroup.com', '000-000-0000', 'ewa', 'EWA Eastlake Wolfpack Association', Tue Aug 05 2025 12:59:15 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 15:52:18 GMT-0700 (Pacific Daylight Time), 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740'),
  ('74148ccb-b5d4-41cb-8e3e-6b2bdc33827d', 'Baxter Kent', 'Secretary', 'ewasecretary1@gmail.com', '000-000-5555', 'ewa', 'EWA Eastlake Wolfpack Association', Tue Aug 05 2025 12:59:15 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 15:52:18 GMT-0700 (Pacific Daylight Time), 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740'),
  ('cbe34395-c4da-4480-82ab-e04ea0ad1d26', 'Shirley Brill', 'Treasurer', 'ewatreasurer@gmail.com', '510-828-5131', 'ewa', 'EWA Eastlake Wolfpack Association', Tue Aug 05 2025 12:59:15 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 15:52:18 GMT-0700 (Pacific Daylight Time), 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740'),
  ('9f054768-48c7-4326-b5b6-b6a9cd09c0f3', 'Andrew Brill', 'Vice President / Insurance', 'ewavpinsurance@gmail.com', '415-637-8623', 'ewa', 'EWA Eastlake Wolfpack Association', Tue Aug 05 2025 12:59:15 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 15:52:18 GMT-0700 (Pacific Daylight Time), 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740'),
  ('4c561e3c-093d-45cf-b81c-058ebfd31631', 'Doug Sargent', 'President', 'ewapresident@gmail.com', '000-000-0000', 'ewa', 'EWA Eastlake Wolfpack Association', Tue Aug 05 2025 12:59:15 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 15:52:18 GMT-0700 (Pacific Daylight Time), 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740');

-- Table: payment_audit_log
DROP TABLE IF EXISTS "payment_audit_log" CASCADE;
CREATE TABLE "payment_audit_log" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "club_id" uuid,
  "action" character varying NOT NULL,
  "field_name" character varying,
  "old_value" text,
  "new_value" text,
  "changed_by" character varying,
  "changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "ip_address" inet,
  "user_agent" text
);

-- Data for payment_audit_log
INSERT INTO "payment_audit_log" VALUES
  ('fca843da-fcb6-4bb4-84a3-0916a51944e6', '5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\ehs-band-boosters-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('330e56fa-e68e-4a6a-9e01-5c3061275a9f', 'a79fec5c-ffbc-4fd2-832f-ddf09019d392', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\ehs-deca-booster-club-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('da42c52b-c940-4551-9338-97c16db06ae7', '05d21d4b-4149-4b7f-9e20-dfa3864f60dd', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\ehs-orchestra-boosters-club-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('2f096113-4fc1-41bd-801e-3245578682c9', '6e69b02b-e467-4879-a7ba-16429e651a53', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\ehs-track-and-field-booster-club-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('a54d74e8-cd66-4d59-bf04-7c564a393e6d', '5b09a2d8-a942-473d-9270-49f13c1b36c3', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\ehs-wrestling-booster-club-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('fbb755a4-4d2b-4475-98cd-9df877ffa44f', 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\ewa-eastlake-wolfpack-association-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('3f1f4d53-eb93-40cb-ba07-dbabdb5bacf2', '99367bd3-c24a-42cd-b581-35f36a29ef49', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-baseball-club-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('fe4a223c-ddaf-4a1d-89ae-481fff57d3af', 'bc3e4b83-e9a7-47ca-b7a9-56e1b4843f66', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-boys-basketball-booster-club-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('ef90908a-baa1-4f40-a375-8e01df844749', 'e30ef488-f120-48b2-9f92-bf1ab60a3ccd', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-boys-golf-booster-club-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('4a40455d-22eb-4a83-a315-e28638815e29', '47d6a7c1-128d-4719-b002-ae34d9012619', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-boys-soccer-zelle.png', 'system', Tue Aug 12 2025 13:25:47 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('e370346a-6303-4c06-a9f1-01b03e74b42a', '4d60931c-5c2a-47d2-ae4a-e37192294f7e', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-boys-swim---dive-booster-club-zelle.png', 'system', Tue Aug 12 2025 13:25:48 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('6fc5ff8f-657d-470c-b68c-6cd745e3f002', 'd2d3fcd3-822b-4466-bbd3-49d55c4fb0bd', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-cheer-booster-club-zelle.png', 'system', Tue Aug 12 2025 13:25:48 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('5d47dfec-dab2-4471-8d00-456eb6bf0733', '40595908-c00e-4d87-a79a-566aa4869715', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-choir-zelle.png', 'system', Tue Aug 12 2025 13:25:48 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('7e3b3c78-123a-49b9-a9e5-374269ef177b', 'ce376909-2bb7-402e-874a-3f542463602a', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-cross-country-boosters-zelle.png', 'system', Tue Aug 12 2025 13:25:48 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('9ccdb5b2-18ac-4e39-b423-2b93ad4beccd', 'cfa44638-82d5-4d26-b5b3-d00f3b7cc428', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-dance-team-boosters-zelle.png', 'system', Tue Aug 12 2025 13:25:48 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('98d11dad-f982-48f6-b6b1-467796cb7765', 'fb289ef9-3f94-4145-b1df-55fafd4362cb', 'update', 'zelle_qr_code_path', NULL, 'zelle-standardized\eastlake-drama-zelle.png', 'system', Tue Aug 12 2025 13:25:48 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('3e15cae8-f252-43a5-a641-3cc9eb862f41', '4d60931c-5c2a-47d2-ae4a-e37192294f7e', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('47c3e6d3-4e91-48cc-ac71-c752d8d784dd', '99367bd3-c24a-42cd-b581-35f36a29ef49', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('0ff3de4d-1351-4e5d-a68a-9a469b2e891f', 'd2d3fcd3-822b-4466-bbd3-49d55c4fb0bd', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('d4ad281c-d615-4d50-a464-feb64deb8291', '05d21d4b-4149-4b7f-9e20-dfa3864f60dd', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('05e49765-1dd9-4e4d-b56d-a2d41105029e', '6e69b02b-e467-4879-a7ba-16429e651a53', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('50049234-1e85-4302-973f-a31c6e849105', '47d6a7c1-128d-4719-b002-ae34d9012619', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('06e2467c-2dc8-42e8-bbf2-b79b2199c480', '40595908-c00e-4d87-a79a-566aa4869715', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('0ad04bc4-4025-45be-aafb-04f49fed92b3', 'a79fec5c-ffbc-4fd2-832f-ddf09019d392', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('8e6288f0-1571-4f77-a8d8-c84fa48ea022', '5b09a2d8-a942-473d-9270-49f13c1b36c3', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('5502485f-9466-4967-8290-e8dfc7b4dd74', 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('50bc78cb-f66d-49d0-b937-197282526c27', 'fb289ef9-3f94-4145-b1df-55fafd4362cb', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('fe0afcba-fed5-4f43-a905-be22a18b8fd1', '5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('827bdaf1-218a-4d6e-8646-72f65f425115', 'bc3e4b83-e9a7-47ca-b7a9-56e1b4843f66', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('980ab48f-d87c-4e28-8aa2-9d364fdaa2bd', 'e30ef488-f120-48b2-9f92-bf1ab60a3ccd', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('cc838c9a-c773-42d4-8ea0-ceed0207041e', 'ce376909-2bb7-402e-874a-3f542463602a', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('c13aea43-5f15-43fb-a9a1-cbdce79367eb', 'cfa44638-82d5-4d26-b5b3-d00f3b7cc428', 'update', 'is_payment_enabled', 'false', 'true', 'system', Tue Aug 12 2025 13:41:56 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('b20d22a9-2903-4919-8ffe-103048cce264', '2b5bfa51-bed6-49f6-aa3a-962e42549d52', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Tue Aug 12 2025 15:13:22 GMT-0700 (Pacific Daylight Time), '127.0.0.1', 'pgbouncer'),
  ('f7c9aee2-c5d6-43f6-8938-cd8dfef0aec6', '933845bd-6e1a-47e0-a3df-e3a7123b3260', 'update', 'is_payment_enabled', 'false', 'true', 'system-fix', Tue Aug 12 2025 15:47:49 GMT-0700 (Pacific Daylight Time), '127.0.0.1', 'pgbouncer'),
  ('269272e2-740d-4d7d-8072-8e7706d9ebbd', 'b926f783-1f1e-41ae-a94a-fdccac50e3f8', 'update', 'is_payment_enabled', 'false', 'true', 'system-fix', Tue Aug 12 2025 15:47:49 GMT-0700 (Pacific Daylight Time), '127.0.0.1', 'pgbouncer'),
  ('f5e177d9-29df-4818-b16d-19992b9ea5c8', '5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'update', 'payment_instructions', NULL, 'Test instructions', 'admin', Tue Aug 12 2025 20:51:23 GMT-0700 (Pacific Daylight Time), '127.0.0.1', 'pgbouncer'),
  ('23c616ca-5524-4f43-a97f-0571f6e1e12f', '5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'update', 'payment_instructions', 'Test instructions', NULL, 'admin', Tue Aug 12 2025 22:00:31 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('abb903ef-cfdc-4747-a62e-238f85550171', '1dcc6157-a3f6-46f3-a50f-23cde148b58b', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Tue Aug 12 2025 22:57:15 GMT-0700 (Pacific Daylight Time), '127.0.0.1', 'pgbouncer'),
  ('d19d6a1f-83bd-4021-b923-beab29118b7a', '40733b78-7d7c-44b8-a713-f5fbfb2ffefb', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Tue Aug 12 2025 22:58:38 GMT-0700 (Pacific Daylight Time), '127.0.0.1', 'pgbouncer'),
  ('cbe66353-ae57-463f-977d-b16bdf842a84', '5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'update', 'is_payment_enabled', 'true', 'false', 'admin', Tue Aug 12 2025 23:42:03 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('41d68ffb-3db1-464c-9add-9154efcbc1ce', '5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Tue Aug 12 2025 23:42:32 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('88323ce9-2ac4-46e3-ace1-ec03867d4dc7', 'bc3e4b83-e9a7-47ca-b7a9-56e1b4843f66', 'update', 'is_payment_enabled', 'true', 'false', 'admin', Tue Aug 12 2025 23:42:45 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('678afd1a-ecc4-4d09-aef8-9858b70d47ac', 'bc3e4b83-e9a7-47ca-b7a9-56e1b4843f66', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Tue Aug 12 2025 23:43:34 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('5ca5da2b-e7c8-46e0-80db-22a13a53eb08', 'e30ef488-f120-48b2-9f92-bf1ab60a3ccd', 'update', 'is_payment_enabled', 'true', 'false', 'admin', Tue Aug 12 2025 23:44:42 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('50707a7f-3dae-475f-958b-3f64d13fd86a', 'e30ef488-f120-48b2-9f92-bf1ab60a3ccd', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Tue Aug 12 2025 23:45:12 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('6daf302e-9b4b-4553-bfab-49cd3d6236e5', 'a79fec5c-ffbc-4fd2-832f-ddf09019d392', 'update', 'is_payment_enabled', 'true', 'false', 'admin', Tue Aug 12 2025 23:47:08 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('3c02db9f-8175-4ad6-b216-7ad690907499', 'a79fec5c-ffbc-4fd2-832f-ddf09019d392', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Tue Aug 12 2025 23:47:12 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('cd936211-aa4e-4fd1-8196-d17b3263d622', '4053c0cb-5959-4379-80f0-e82998225318', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Sat Aug 16 2025 19:52:16 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer'),
  ('4718e99b-0631-494c-b67d-ca323ec56a1e', '77273cdf-390f-4611-ae8a-81c542e69def', 'update', 'is_payment_enabled', 'false', 'true', 'admin', Sat Aug 16 2025 21:32:22 GMT-0700 (Pacific Daylight Time), '::1', 'pgbouncer');

-- Table: test_table
DROP TABLE IF EXISTS "test_table" CASCADE;
CREATE TABLE "test_table" (
  "id" integer NOT NULL DEFAULT nextval('test_table_id_seq'::regclass),
  "name" text
);

-- Table: users
DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
  "username" character varying NOT NULL,
  "password" character varying NOT NULL,
  "role" character varying NOT NULL DEFAULT 'user'::character varying,
  "club" character varying,
  "club_name" character varying,
  "is_locked" boolean DEFAULT false,
  "is_first_login" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "last_login" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "club_id" uuid,
  "secret_question" character varying,
  "secret_answer" character varying
);

-- Data for users
INSERT INTO "users" VALUES
  ('orchestra_booster', 'ewa2025', 'booster', 'orchestra', 'Eastlake Orchestra Booster Club', false, NULL, Tue Aug 05 2025 12:57:55 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 02:17:44 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 02:17:44 GMT-0700 (Pacific Daylight Time), '05d21d4b-4149-4b7f-9e20-dfa3864f60dd', 'Favorite Food', 'Pizza'),
  ('admin', 'ewa2025', 'admin', '', '', false, NULL, Tue Aug 05 2025 12:57:55 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 22:53:21 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 22:53:21 GMT-0700 (Pacific Daylight Time), 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740', NULL, NULL);

-- Table: volunteers
DROP TABLE IF EXISTS "volunteers" CASCADE;
CREATE TABLE "volunteers" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "email" character varying,
  "phone" character varying,
  "club" character varying NOT NULL,
  "club_name" character varying NOT NULL,
  "interests" text,
  "availability" text,
  "status" character varying DEFAULT 'pending'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "notes" text,
  "assigned_club_id" uuid
);

-- Data for volunteers
INSERT INTO "volunteers" VALUES
  ('2d46d795-1db1-440c-a0aa-12f9b7150edf', 'Test Volunteer', 'test@example.com', '555-1234', 'EWA Eastlake Wolfpack Association', 'EWA Eastlake Wolfpack Association', 'Test Child', '', 'approved', Mon Aug 11 2025 22:24:45 GMT-0700 (Pacific Daylight Time), Tue Aug 12 2025 01:39:16 GMT-0700 (Pacific Daylight Time), NULL, NULL),
  ('eec99f26-bea5-4e4a-b9db-83d2b3a0b0ab', 'Stephanie Byeman', 'sbyeman@gmail.com', '4253018280', 'Eastlake Baseball Club', 'Eastlake Baseball Club', 'Ben Byeman', '', 'contacted', Wed Aug 13 2025 19:13:40 GMT-0700 (Pacific Daylight Time), Sat Aug 16 2025 12:05:06 GMT-0700 (Pacific Daylight Time), NULL, NULL);

