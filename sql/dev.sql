CREATE SCHEMA test;

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


CREATE TABLE test.agents (
    id integer NOT NULL,
    divergence smallint NOT NULL,
    full_config text NOT NULL,
    data_set_id integer NOT NULL,
    predicate_id integer NOT NULL
);
CREATE SEQUENCE test.agents_ids INCREMENT BY 1 START WITH 1;
ALTER TABLE test.agents ALTER id SET DEFAULT nextval('test.agents_ids'::regclass);
ALTER TABLE test.agents ADD CONSTRAINT agents_p PRIMARY KEY (id);
ALTER TABLE test.agents ADD CONSTRAINT agents_data_sets FOREIGN KEY (data_set_id) REFERENCES test.data_sets(id);
ALTER TABLE test.agents ADD CONSTRAINT agnts_predicates FOREIGN KEY (predicate_id) REFERENCES test.predicates(id);
ALTER TABLE test.agents OWNER TO postgres;


