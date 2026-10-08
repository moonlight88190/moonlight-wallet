CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  selfie_path text NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('aadhaar','pan','driving_license','school_id','college_id','library_id')),
  doc_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kyc_submissions_user_idx ON public.kyc_submissions(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.kyc_submissions TO authenticated;
GRANT ALL ON public.kyc_submissions TO service_role;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kyc read" ON public.kyc_submissions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own kyc insert" ON public.kyc_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND review_note IS NULL AND reviewed_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.kyc_submissions k WHERE k.user_id = auth.uid() AND k.status IN ('pending','approved')));

CREATE POLICY "kyc own upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "kyc own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.enforce_kyc_on_withdrawal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE created timestamptz;
BEGIN
  SELECT created_at INTO created FROM public.profiles WHERE id = NEW.user_id;
  IF created IS NOT NULL AND now() >= created + INTERVAL '5 days'
     AND NOT EXISTS (SELECT 1 FROM public.kyc_submissions WHERE user_id = NEW.user_id AND status = 'approved') THEN
    RAISE EXCEPTION 'KYC verification required. Complete KYC to continue withdrawing.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER withdrawals_enforce_kyc BEFORE INSERT ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kyc_on_withdrawal();