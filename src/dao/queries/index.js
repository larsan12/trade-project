module.exports = {
    getLastOverlaps: `
        WITH rows_rank as (
            SELECT *, row_number() OVER (PARTITION BY hypotes_id ORDER BY step DESC)  AS rank
            FROM test."overlaps"
            WHERE agent_id = $1
        )
        SELECT * from rows_rank where rank <=$2 order by hypotes_id;
    `,
};
