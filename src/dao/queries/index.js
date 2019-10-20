module.exports = {
    getTransactions: `
        SELECT
            day as "date",
            game_name,
            partner,
            au::float,
            ses::int,
            payin::float,
            payout::float,
            ggr::float,
            (ggr / payin * 100)::float as "rtp",
            (ggr * 0.1)::float as net,
            sum (payin) over (PARTITION BY game_name, partner order by day)::float as "payinSum",
            sum (payout) over (PARTITION BY game_name, partner order by day)::float as "payoutSum",
            sum (ggr) over (PARTITION BY game_name, partner order by day)::float as "ggrSum",
            sum(ggr * 0.1) over (PARTITION BY game_name, partner order by day)::float as "netSum",
            (avg((ggr / payin * 100)) over (PARTITION BY game_name, partner order by day))::float as "avgRtp"
        FROM (
                 SELECT day,
                        sum(payin_sum)::numeric(22,2)          as "payin",
                        sum(payout_sum)::numeric(22,2)         as "payout",
                        count(distinct user_id) as "au",
                        count(distinct game_id) as "ses",
                        (sum(payin_sum) - sum(payout_sum))::numeric(22,2) as "ggr",
                        game_name,
                        partner
                 FROM (
                          SELECT bill_id,
                                 game_id,
                                 user_id,
                                 date(bills.dttm_created AT TIME ZONE '+0')  AS day,
                                 payin_sum * rate         as payin_sum,
                                 payout_sum * rate        as payout_sum,
                                 game_kinds.game_name AS game_name,
                                 contractors.contractor_name as partner
                          FROM game.bills
                                   INNER JOIN game.wallets USING (wallet_id)
                                   INNER JOIN game.realms USING (realm_id)
                                   INNER JOIN game.game_kinds USING (game_kind)
                                   INNER JOIN game.contractors ON game.realms.contractor_id = game.contractors.contractor_id
                                   INNER JOIN (
                              SELECT *
                              FROM (
                                       VALUES ('RUB', 0.02),
                                              ('UAH', 0.04),
                                              ('TRY', 0.18),
                                              ('USD', 1),
                                              ('EUR', 1.12),
                                              ('AMD', 0.0021)
                                   ) as conv(curr, rate)
                          ) as conv(curr, rate) ON (currency = conv.curr)
                          WHERE bills.wallet_id != 5
                            AND bills.wallet_id != 6
                            AND status = 'paidout'
                            AND bills.dttm_created >= '2019-04-04T14:00:00+03'
                      ) as base
                 GROUP BY day, game_name, partner
             ) as agg
        ORDER by date;
    `
};
