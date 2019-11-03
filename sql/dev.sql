CREATE SCHEMA test;

--
-- Type: TABLE ; Name: data_sets; Owner: postgres
--

CREATE SEQUENCE test.data_sets_ids INCREMENT BY 1 START WITH 1;
CREATE TABLE test.data_sets (
    id integer NOT NULL,
    company character(25) NOT NULL,
    "interval" smallint NOT NULL,
    first_date timestamp with time zone,
    last_date timestamp with time zone
);
ALTER TABLE test.data_sets ALTER id SET DEFAULT nextval('test.data_sets_ids'::regclass);
ALTER TABLE test.data_sets ADD CONSTRAINT uniq_opts UNIQUE (company, "interval");
ALTER TABLE test.data_sets ADD CONSTRAINT data_sets_p PRIMARY KEY (id);
ALTER TABLE test.data_sets OWNER TO postgres;

--
-- Type: TABLE ; Name: data; Owner: postgres
--

CREATE TABLE test.data (
    "time" timestamp with time zone NOT NULL,
    open real,
    close real,
    max real,
    min real,
    volume real,
    data_set_id integer NOT NULL
);
ALTER TABLE test.data ADD CONSTRAINT data_p PRIMARY KEY (data_set_id, "time");
ALTER TABLE test.data ADD CONSTRAINT data_id_key FOREIGN KEY (data_set_id) REFERENCES test.data_sets(id);
ALTER TABLE test.data OWNER TO postgres;

--
-- Type: TABLE ; Name: predicates; Owner: postgres
--

CREATE SEQUENCE test.predicates_ids INCREMENT BY 1 START WITH 1;
CREATE TABLE test.predicates (
    id integer NOT NULL,
    full_config text NOT NULL,
    common boolean NOT NULL,
    data_set_id integer
);
ALTER TABLE test.predicates ALTER id SET DEFAULT nextval('test.predicates_ids'::regclass);
ALTER TABLE test.predicates ALTER common SET DEFAULT true;
ALTER TABLE test.predicates ADD CONSTRAINT predicates_p PRIMARY KEY (id);
ALTER TABLE test.predicates ADD CONSTRAINT predicates_data_sets FOREIGN KEY (data_set_id) REFERENCES test.data_sets(id);
ALTER TABLE test.predicates OWNER TO postgres;

--
-- Type: TABLE ; Name: agents; Owner: postgres
--

CREATE TABLE test.agents (
    id integer NOT NULL,
    divergence smallint NOT NULL,
    full_config text NOT NULL,
    data_set_id integer NOT NULL,
    predicate_id integer NOT NULL,
    last_index integer
);
CREATE SEQUENCE test.agents_ids INCREMENT BY 1 START WITH 1;
ALTER TABLE test.agents ALTER id SET DEFAULT nextval('test.agents_ids'::regclass);
ALTER TABLE test.agents ALTER last_index SET DEFAULT 0;
ALTER TABLE test.agents ADD CONSTRAINT agents_p PRIMARY KEY (id);
ALTER TABLE test.agents ADD CONSTRAINT agents_data_sets FOREIGN KEY (data_set_id) REFERENCES test.data_sets(id);
ALTER TABLE test.agents ADD CONSTRAINT agnts_predicates FOREIGN KEY (predicate_id) REFERENCES test.predicates(id);
ALTER TABLE test.agents OWNER TO postgres;

--
-- Type: TABLE ; Name: hypoteses; Owner: postgres
--

CREATE SEQUENCE test.hypoteses_ids INCREMENT BY 1 START WITH 1;
ALTER SEQUENCE test.hypoteses_ids OWNER TO postgres;
CREATE TABLE test.hypoteses (
    comb_id text NOT NULL,
    predicate_id integer NOT NULL,
    steps_ahead smallint NOT NULL,
    string text NOT NULL,
    "all" integer NOT NULL,
    up integer NOT NULL,
    block integer,
    commulation real NOT NULL,
    id integer NOT NULL
);
ALTER TABLE test.hypoteses ALTER id SET DEFAULT nextval('test.hypoteses_ids'::regclass);
ALTER TABLE test.hypoteses ADD CONSTRAINT hypoteses_p PRIMARY KEY (id);
ALTER TABLE test.hypoteses ADD CONSTRAINT hypoteses_predicates FOREIGN KEY (predicate_id) REFERENCES test.predicates(id);
ALTER TABLE test.hypoteses OWNER TO postgres;

--
-- Type: TABLE ; Name: hypoteses_hist; Owner: postgres
--

CREATE TABLE test.hypoteses_hist (
    hypotes_id integer NOT NULL,
    agent_id integer NOT NULL,
    "time" time with time zone NOT NULL,
    value real
);
ALTER TABLE test.hypoteses_hist ADD CONSTRAINT hypoteses_hist_p PRIMARY KEY (hypotes_id, agent_id, "time");
ALTER TABLE test.hypoteses_hist ADD CONSTRAINT hypoteses_hist_hypoteses FOREIGN KEY (hypotes_id) REFERENCES test.hypoteses(id);
ALTER TABLE test.hypoteses_hist ADD CONSTRAINT hypoteses_hist_agents FOREIGN KEY (agent_id) REFERENCES test.agents(id);

--
-- Type: TABLE ; Name: operations; Owner: postgres
--

CREATE TABLE test.operations (
    agent_id integer NOT NULL,
    hypotes_id integer NOT NULL,
    "time" timestamp with time zone NOT NULL,
    "from" integer NOT NULL,
    steps smallint NOT NULL,
    profit real
);
ALTER TABLE test.operations ADD CONSTRAINT operations_p PRIMARY KEY (agent_id, "time");
ALTER TABLE test.operations ADD CONSTRAINT operations_agents FOREIGN KEY (agent_id) REFERENCES test.agents(id);
ALTER TABLE test.operations ADD CONSTRAINT operations_hypotes FOREIGN KEY (hypotes_id) REFERENCES test.hypoteses(id);
ALTER TABLE test.operations OWNER TO postgres;