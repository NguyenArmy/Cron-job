--
-- PostgreSQL database dump
--

\restrict u5bZhGOaejkZRbI5fddEt687X1HT8vm6VGSCZx0vjgflidKvpUedvbcybPeQSji

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    "userId" integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "refreshTokenHash" text
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: Permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Permission" (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Permission" OWNER TO postgres;

--
-- Name: Permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Permission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Permission_id_seq" OWNER TO postgres;

--
-- Name: Permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Permission_id_seq" OWNED BY public."Permission".id;


--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RolePermission" (
    "roleId" integer NOT NULL,
    "permissionId" integer NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO postgres;

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO postgres;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: Scheduler; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Scheduler" (
    id integer NOT NULL,
    name text NOT NULL,
    cron text NOT NULL,
    timezone text DEFAULT 'Asia/Ho_Chi_Minh'::text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" integer NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "lastRunTime" timestamp(3) without time zone,
    "nextRunTime" timestamp(3) without time zone
);


ALTER TABLE public."Scheduler" OWNER TO postgres;

--
-- Name: Scheduler_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Scheduler_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Scheduler_id_seq" OWNER TO postgres;

--
-- Name: Scheduler_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Scheduler_id_seq" OWNED BY public."Scheduler".id;


--
-- Name: TaskAssignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TaskAssignment" (
    id integer NOT NULL,
    "scheduleId" integer NOT NULL,
    "userId" integer NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TaskAssignment" OWNER TO postgres;

--
-- Name: TaskAssignment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."TaskAssignment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TaskAssignment_id_seq" OWNER TO postgres;

--
-- Name: TaskAssignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."TaskAssignment_id_seq" OWNED BY public."TaskAssignment".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    name text,
    "roleId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Permission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission" ALTER COLUMN id SET DEFAULT nextval('public."Permission_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: Scheduler id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Scheduler" ALTER COLUMN id SET DEFAULT nextval('public."Scheduler_id_seq"'::regclass);


--
-- Name: TaskAssignment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaskAssignment" ALTER COLUMN id SET DEFAULT nextval('public."TaskAssignment_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" ("userId", email, password, "refreshTokenHash") FROM stdin;
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Permission" (id, name) FROM stdin;
1	scheduler:create
2	scheduler:read
3	scheduler:update
4	scheduler:delete
5	role:create
6	role:read
7	role:update
8	role:delete
9	permission:create
10	permission:read
11	permission:update
12	permission:delete
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Role" (id, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RolePermission" ("roleId", "permissionId") FROM stdin;
\.


--
-- Data for Name: Scheduler; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Scheduler" (id, name, cron, timezone, description, "createdAt", "updatedAt", "createdById", "isActive", "lastRunTime", "nextRunTime") FROM stdin;
\.


--
-- Data for Name: TaskAssignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TaskAssignment" (id, "scheduleId", "userId", "assignedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, "roleId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
734cec4e-f9cb-4e5d-90ef-91284ae6ae3f	7fdde1bfd44773ffb558c39d0454957af222d831888ce698a70e0403f82e788b	2026-07-30 09:01:41.849782+00	20260728163530_create_auth_tables	\N	\N	2026-07-30 09:01:41.808176+00	1
8833efa1-a38f-414f-ae41-60cf406d1a9a	63a3eb8e00b713991455c7f973847652126ab0f96d33da16dca3e225fa466a5e	2026-07-30 09:01:56.551869+00	20260730090156_sync_current_schema	\N	\N	2026-07-30 09:01:56.515813+00	1
21b7b69a-0399-4afc-9441-57414509f16d	647a920a2ce3e12ef5eac2d281b499bc24aae81aef4c8440c0a94995a723c02b	2026-07-31 04:00:16.527618+00	20260731040016	\N	\N	2026-07-31 04:00:16.494322+00	1
0cca529c-2803-4fbb-84e4-ab08095258e6	2f39ec9cfb9d50463c72ccf43a0062bd4fa9133221362f0bd47c673c5111e142	2026-07-31 04:11:44.671125+00	20260731050000_seed_permissions	\N	\N	2026-07-31 04:11:44.658214+00	1
\.


--
-- Name: Permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Permission_id_seq"', 12, true);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Role_id_seq"', 1, false);


--
-- Name: Scheduler_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Scheduler_id_seq"', 1, false);


--
-- Name: TaskAssignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."TaskAssignment_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, false);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("userId");


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Scheduler Scheduler_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Scheduler"
    ADD CONSTRAINT "Scheduler_pkey" PRIMARY KEY (id);


--
-- Name: TaskAssignment TaskAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaskAssignment"
    ADD CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_email_key" ON public."Account" USING btree (email);


--
-- Name: Permission_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Permission_name_key" ON public."Permission" USING btree (name);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: TaskAssignment_scheduleId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TaskAssignment_scheduleId_userId_key" ON public."TaskAssignment" USING btree ("scheduleId", "userId");


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Scheduler Scheduler_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Scheduler"
    ADD CONSTRAINT "Scheduler_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TaskAssignment TaskAssignment_scheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaskAssignment"
    ADD CONSTRAINT "TaskAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES public."Scheduler"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaskAssignment TaskAssignment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaskAssignment"
    ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict u5bZhGOaejkZRbI5fddEt687X1HT8vm6VGSCZx0vjgflidKvpUedvbcybPeQSji

