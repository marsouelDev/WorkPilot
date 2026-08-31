-- ============================================================
-- DASHBOARD DATA — User normal + Admin (vue globale)
-- Tables : utilisateurs / projets / taches / pull_requests
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_user_id INTEGER,
  p_range TEXT DEFAULT '30d'
)
RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_stats JSON;
  v_taches_chart JSON;
  v_projets_chart JSON;
  v_users_chart JSON;
  v_projets_recents JSON;
  v_users_recents JSON;
  v_taches_start TIMESTAMP;
  v_projets_start TIMESTAMP;
  v_users_start TIMESTAMP;
  v_taches_interval TEXT;
  v_projets_interval TEXT;
  v_users_interval TEXT;
  v_taches_format TEXT;
  v_projets_format TEXT;
  v_users_format TEXT;
BEGIN
  -- ============ DÉTECTION ADMIN (table utilisateurs) ============
  SELECT COALESCE("roleGlobal" = 'admin', FALSE) INTO v_is_admin
  FROM utilisateurs
  WHERE id = p_user_id;

  -- ============ BORNES TEMPORELLES ============
  v_taches_start := CASE p_range
    WHEN '7d'  THEN CURRENT_DATE - INTERVAL '6 days'
    WHEN '30d' THEN CURRENT_DATE - INTERVAL '29 days'
    WHEN '90d' THEN CURRENT_DATE - INTERVAL '89 days'
    WHEN '6m'  THEN CURRENT_DATE - INTERVAL '6 months'
    WHEN '1y'  THEN CURRENT_DATE - INTERVAL '1 year'
    ELSE NULL
  END;

  v_projets_start := v_taches_start;
  v_users_start := v_taches_start;

  v_taches_interval := CASE p_range
    WHEN '7d'  THEN 'day'
    WHEN '30d' THEN 'day'
    WHEN '90d' THEN 'week'
    WHEN '6m'  THEN 'week'
    WHEN '1y'  THEN 'month'
    ELSE 'month'
  END;

  v_projets_interval := CASE p_range
    WHEN '7d'  THEN 'day'
    WHEN '30d' THEN 'week'
    WHEN '90d' THEN 'month'
    WHEN '6m'  THEN 'month'
    WHEN '1y'  THEN 'month'
    ELSE 'month'
  END;

  v_users_interval := v_projets_interval;

  v_taches_format := CASE v_taches_interval
    WHEN 'day'   THEN 'YYYY-MM-DD'
    WHEN 'week'  THEN 'IYYY-"W"IW'
    WHEN 'month' THEN 'YYYY-MM'
  END;

  v_projets_format := CASE v_projets_interval
    WHEN 'day'   THEN 'YYYY-MM-DD'
    WHEN 'week'  THEN 'IYYY-"W"IW'
    WHEN 'month' THEN 'YYYY-MM'
  END;

  v_users_format := v_projets_format;

  -- ============ 1. STATS GLOBALES ============
  IF v_is_admin THEN
    SELECT json_build_object(
      'totalProjets', (SELECT COUNT(*) FROM projets),
      'totalUsers', (SELECT COUNT(*) FROM utilisateurs),
      'attribuees', (SELECT COUNT(*) FROM taches WHERE statut = 'attribuee'),
      'enRevue', (SELECT COUNT(*) FROM taches WHERE statut = 'en_revue'),
      'terminees', (SELECT COUNT(*) FROM taches WHERE statut = 'terminee'),
      'totalPullRequests', (SELECT COUNT(*) FROM pull_requests)
    ) INTO v_stats;
  ELSE
    SELECT json_build_object(
      'totalProjets', (SELECT COUNT(*) FROM projets WHERE "createurId" = p_user_id),
      'attribuees', (SELECT COUNT(*) FROM taches WHERE "assigneeId" = p_user_id AND statut = 'attribuee'),
      'enRevue', (SELECT COUNT(*) FROM taches WHERE "assigneeId" = p_user_id AND statut = 'en_revue'),
      'terminees', (SELECT COUNT(*) FROM taches WHERE "assigneeId" = p_user_id AND statut = 'terminee'),
      'totalPullRequests', (
        SELECT COUNT(*)
        FROM pull_requests pr
        JOIN taches t ON t.id = pr."tacheId"
        WHERE t."assigneeId" = p_user_id
      )
    ) INTO v_stats;
  END IF;

  -- ============ 2. GRAPHE TÂCHES ============
  IF v_taches_start IS NOT NULL THEN
    IF v_is_admin THEN
      EXECUTE format($dyn$
        WITH buckets AS (
          SELECT generate_series(
            date_trunc(%1$L, %2$L::timestamp),
            date_trunc(%1$L, CURRENT_TIMESTAMP),
            ('1 ' || %1$L)::interval
          ) AS bucket
        ),
        taches_data AS (
          SELECT date_trunc(%1$L, "updatedAt") AS bucket, statut, COUNT(*) AS cnt
          FROM taches
          WHERE statut IN ('attribuee', 'en_revue', 'terminee')
            AND "updatedAt" >= %2$L::timestamp
          GROUP BY 1, 2
        ),
        per_bucket AS (
          SELECT
            b.bucket,
            COALESCE(SUM(CASE WHEN td.statut = 'attribuee' THEN td.cnt ELSE 0 END), 0) AS attribuees,
            COALESCE(SUM(CASE WHEN td.statut = 'en_revue'  THEN td.cnt ELSE 0 END), 0) AS enrevue,
            COALESCE(SUM(CASE WHEN td.statut = 'terminee'  THEN td.cnt ELSE 0 END), 0) AS terminees
          FROM buckets b
          LEFT JOIN taches_data td ON td.bucket = b.bucket
          GROUP BY b.bucket
        )
        SELECT COALESCE(json_agg(
          json_build_object(
            'date',       to_char(bucket, %3$L),
            'attribuees', attribuees,
            'enRevue',    enrevue,
            'terminees',  terminees
          ) ORDER BY bucket
        ), '[]'::json)
        FROM per_bucket
      $dyn$, v_taches_interval, v_taches_start, v_taches_format)
      INTO v_taches_chart;
    ELSE
      EXECUTE format($dyn$
        WITH buckets AS (
          SELECT generate_series(
            date_trunc(%1$L, %2$L::timestamp),
            date_trunc(%1$L, CURRENT_TIMESTAMP),
            ('1 ' || %1$L)::interval
          ) AS bucket
        ),
        taches_data AS (
          SELECT date_trunc(%1$L, "updatedAt") AS bucket, statut, COUNT(*) AS cnt
          FROM taches
          WHERE "assigneeId" = %3$s
            AND statut IN ('attribuee', 'en_revue', 'terminee')
            AND "updatedAt" >= %2$L::timestamp
          GROUP BY 1, 2
        ),
        per_bucket AS (
          SELECT
            b.bucket,
            COALESCE(SUM(CASE WHEN td.statut = 'attribuee' THEN td.cnt ELSE 0 END), 0) AS attribuees,
            COALESCE(SUM(CASE WHEN td.statut = 'en_revue'  THEN td.cnt ELSE 0 END), 0) AS enrevue,
            COALESCE(SUM(CASE WHEN td.statut = 'terminee'  THEN td.cnt ELSE 0 END), 0) AS terminees
          FROM buckets b
          LEFT JOIN taches_data td ON td.bucket = b.bucket
          GROUP BY b.bucket
        )
        SELECT COALESCE(json_agg(
          json_build_object(
            'date',       to_char(bucket, %4$L),
            'attribuees', attribuees,
            'enRevue',    enrevue,
            'terminees',  terminees
          ) ORDER BY bucket
        ), '[]'::json)
        FROM per_bucket
      $dyn$, v_taches_interval, v_taches_start, p_user_id, v_taches_format)
      INTO v_taches_chart;
    END IF;
  ELSE
    IF v_is_admin THEN
      EXECUTE format($dyn$
        SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.date), '[]'::json)
        FROM (
          SELECT to_char(date_trunc(%1$L, "updatedAt"), %2$L) AS date,
                 COUNT(*) FILTER (WHERE statut = 'attribuee') AS attribuees,
                 COUNT(*) FILTER (WHERE statut = 'en_revue')  AS "enRevue",
                 COUNT(*) FILTER (WHERE statut = 'terminee')  AS terminees
          FROM taches
          WHERE statut IN ('attribuee', 'en_revue', 'terminee')
          GROUP BY 1
        ) sub
      $dyn$, v_taches_interval, v_taches_format)
      INTO v_taches_chart;
    ELSE
      EXECUTE format($dyn$
        SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.date), '[]'::json)
        FROM (
          SELECT to_char(date_trunc(%1$L, "updatedAt"), %2$L) AS date,
                 COUNT(*) FILTER (WHERE statut = 'attribuee') AS attribuees,
                 COUNT(*) FILTER (WHERE statut = 'en_revue')  AS "enRevue",
                 COUNT(*) FILTER (WHERE statut = 'terminee')  AS terminees
          FROM taches
          WHERE "assigneeId" = %3$s
            AND statut IN ('attribuee', 'en_revue', 'terminee')
          GROUP BY 1
        ) sub
      $dyn$, v_taches_interval, v_taches_format, p_user_id)
      INTO v_taches_chart;
    END IF;
  END IF;

  -- ============ 3. GRAPHE PROJETS ============
  IF v_projets_start IS NOT NULL THEN
    IF v_is_admin THEN
      EXECUTE format($dyn$
        WITH buckets AS (
          SELECT generate_series(
            date_trunc(%1$L, %2$L::timestamp),
            date_trunc(%1$L, CURRENT_TIMESTAMP),
            ('1 ' || %1$L)::interval
          ) AS bucket
        ),
        projets_data AS (
          SELECT date_trunc(%1$L, "createdAt") AS bucket, COUNT(*) AS cnt
          FROM projets
          WHERE "createdAt" >= %2$L::timestamp
          GROUP BY 1
        )
        SELECT COALESCE(json_agg(
          json_build_object(
            'date',  to_char(b.bucket, %3$L),
            'count', COALESCE(pd.cnt, 0)
          ) ORDER BY b.bucket
        ), '[]'::json)
        FROM buckets b
        LEFT JOIN projets_data pd ON pd.bucket = b.bucket
      $dyn$, v_projets_interval, v_projets_start, v_projets_format)
      INTO v_projets_chart;
    ELSE
      EXECUTE format($dyn$
        WITH buckets AS (
          SELECT generate_series(
            date_trunc(%1$L, %2$L::timestamp),
            date_trunc(%1$L, CURRENT_TIMESTAMP),
            ('1 ' || %1$L)::interval
          ) AS bucket
        ),
        projets_data AS (
          SELECT date_trunc(%1$L, "createdAt") AS bucket, COUNT(*) AS cnt
          FROM projets
          WHERE "createurId" = %3$s
            AND "createdAt" >= %2$L::timestamp
          GROUP BY 1
        )
        SELECT COALESCE(json_agg(
          json_build_object(
            'date',  to_char(b.bucket, %4$L),
            'count', COALESCE(pd.cnt, 0)
          ) ORDER BY b.bucket
        ), '[]'::json)
        FROM buckets b
        LEFT JOIN projets_data pd ON pd.bucket = b.bucket
      $dyn$, v_projets_interval, v_projets_start, p_user_id, v_projets_format)
      INTO v_projets_chart;
    END IF;
  ELSE
    IF v_is_admin THEN
      EXECUTE format($dyn$
        SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.date), '[]'::json)
        FROM (
          SELECT to_char(date_trunc(%1$L, "createdAt"), %2$L) AS date, COUNT(*) AS count
          FROM projets
          GROUP BY 1
        ) sub
      $dyn$, v_projets_interval, v_projets_format)
      INTO v_projets_chart;
    ELSE
      EXECUTE format($dyn$
        SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.date), '[]'::json)
        FROM (
          SELECT to_char(date_trunc(%1$L, "createdAt"), %2$L) AS date, COUNT(*) AS count
          FROM projets
          WHERE "createurId" = %3$s
          GROUP BY 1
        ) sub
      $dyn$, v_projets_interval, v_projets_format, p_user_id)
      INTO v_projets_chart;
    END IF;
  END IF;

  -- ============ 4. GRAPHE USERS (admin) ============
  IF v_is_admin THEN
    IF v_users_start IS NOT NULL THEN
      EXECUTE format($dyn$
        WITH buckets AS (
          SELECT generate_series(
            date_trunc(%1$L, %2$L::timestamp),
            date_trunc(%1$L, CURRENT_TIMESTAMP),
            ('1 ' || %1$L)::interval
          ) AS bucket
        ),
        users_data AS (
          SELECT date_trunc(%1$L, "createdAt") AS bucket, COUNT(*) AS cnt
          FROM utilisateurs
          WHERE "createdAt" >= %2$L::timestamp
          GROUP BY 1
        )
        SELECT COALESCE(json_agg(
          json_build_object(
            'date',  to_char(b.bucket, %3$L),
            'count', COALESCE(ud.cnt, 0)
          ) ORDER BY b.bucket
        ), '[]'::json)
        FROM buckets b
        LEFT JOIN users_data ud ON ud.bucket = b.bucket
      $dyn$, v_users_interval, v_users_start, v_users_format)
      INTO v_users_chart;
    ELSE
      EXECUTE format($dyn$
        SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.date), '[]'::json)
        FROM (
          SELECT to_char(date_trunc(%1$L, "createdAt"), %2$L) AS date, COUNT(*) AS count
          FROM utilisateurs
          GROUP BY 1
        ) sub
      $dyn$, v_users_interval, v_users_format)
      INTO v_users_chart;
    END IF;
  ELSE
    v_users_chart := '[]'::json;
  END IF;

  -- ============ 5. PROJETS RÉCENTS ============
  IF v_is_admin THEN
    SELECT json_agg(
      json_build_object(
        'id', p.id,
        'titre', p.titre,
        'description', p."descriptionSommaire",
        'createdAt', to_char(p."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'createurNom', TRIM(COALESCE(u.prenom, '') || ' ' || COALESCE(u.nom, '')),
        'totalTaches', COALESCE(tc.total, 0),
        'tachesTerminees', COALESCE(tt.terminees, 0),
        'progression', CASE
          WHEN COALESCE(tc.total, 0) > 0
          THEN ROUND((COALESCE(tt.terminees, 0)::numeric / tc.total) * 100)
          ELSE 0
        END
      ) ORDER BY p."createdAt" DESC
    ) INTO v_projets_recents
    FROM (
      SELECT id, titre, "descriptionSommaire", "createdAt", "createurId"
      FROM projets
      ORDER BY "createdAt" DESC
      LIMIT 5
    ) p
    LEFT JOIN utilisateurs u ON u.id = p."createurId"
    LEFT JOIN (
      SELECT "projetId", COUNT(*) AS total FROM taches GROUP BY "projetId"
    ) tc ON tc."projetId" = p.id
    LEFT JOIN (
      SELECT "projetId", COUNT(*) AS terminees
      FROM taches WHERE statut = 'terminee'
      GROUP BY "projetId"
    ) tt ON tt."projetId" = p.id;
  ELSE
    SELECT json_agg(
      json_build_object(
        'id', p.id,
        'titre', p.titre,
        'description', p."descriptionSommaire",
        'createdAt', to_char(p."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'totalTaches', COALESCE(tc.total, 0),
        'tachesTerminees', COALESCE(tt.terminees, 0),
        'progression', CASE
          WHEN COALESCE(tc.total, 0) > 0
          THEN ROUND((COALESCE(tt.terminees, 0)::numeric / tc.total) * 100)
          ELSE 0
        END
      ) ORDER BY p."createdAt" DESC
    ) INTO v_projets_recents
    FROM (
      SELECT id, titre, "descriptionSommaire", "createdAt"
      FROM projets
      WHERE "createurId" = p_user_id
      ORDER BY "createdAt" DESC
      LIMIT 5
    ) p
    LEFT JOIN (
      SELECT "projetId", COUNT(*) AS total FROM taches GROUP BY "projetId"
    ) tc ON tc."projetId" = p.id
    LEFT JOIN (
      SELECT "projetId", COUNT(*) AS terminees
      FROM taches WHERE statut = 'terminee'
      GROUP BY "projetId"
    ) tt ON tt."projetId" = p.id;
  END IF;

  -- ============ 6. USERS RÉCENTS (admin) ============
  IF v_is_admin THEN
    SELECT json_agg(
      json_build_object(
        'id', u.id,
        'prenom', COALESCE(u.prenom, ''),
        'nom', COALESCE(u.nom, ''),
        'email', u.email,
        'createdAt', to_char(u."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'totalProjets', COALESCE(pc.total, 0),
        'totalTaches', COALESCE(tc.total, 0)
      ) ORDER BY u."createdAt" DESC
    ) INTO v_users_recents
    FROM (
      SELECT id, prenom, nom, email, "createdAt"
      FROM utilisateurs
      ORDER BY "createdAt" DESC
      LIMIT 5
    ) u
    LEFT JOIN (
      SELECT "createurId", COUNT(*) AS total FROM projets GROUP BY "createurId"
    ) pc ON pc."createurId" = u.id
    LEFT JOIN (
      SELECT "assigneeId", COUNT(*) AS total FROM taches GROUP BY "assigneeId"
    ) tc ON tc."assigneeId" = u.id;
  ELSE
    v_users_recents := '[]'::json;
  END IF;

  -- ============ RETOUR ============
  RETURN json_build_object(
    'isAdmin', v_is_admin,
    'stats', v_stats,
    'tachesChart', COALESCE(v_taches_chart, '[]'::json),
    'projetsChart', COALESCE(v_projets_chart, '[]'::json),
    'usersChart', COALESCE(v_users_chart, '[]'::json),
    'projetsRecents', COALESCE(v_projets_recents, '[]'::json),
    'usersRecents', COALESCE(v_users_recents, '[]'::json),
    'range', p_range
  );
END;
$$ LANGUAGE plpgsql;

-- ============ INDEX D'OPTIMISATION ============
CREATE INDEX IF NOT EXISTS idx_taches_assignee_statut ON taches("assigneeId", statut);
CREATE INDEX IF NOT EXISTS idx_taches_assignee_dates ON taches("assigneeId", "createdAt", "updatedAt");
CREATE INDEX IF NOT EXISTS idx_taches_statut_dates ON taches(statut, "updatedAt");
CREATE INDEX IF NOT EXISTS idx_projets_createur_created ON projets("createurId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_projets_created ON projets("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_users_created ON utilisateurs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON utilisateurs("roleGlobal");
CREATE INDEX IF NOT EXISTS idx_pull_requests_tache ON pull_requests("tacheId");