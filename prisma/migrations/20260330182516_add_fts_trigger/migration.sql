-- Create function to update the search vector
CREATE OR REPLACE FUNCTION episode_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('french', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(array_to_string(NEW.keywords, ' '), '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(NEW."wikiSummary", '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger on Episode table
CREATE TRIGGER episode_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Episode"
  FOR EACH ROW
  EXECUTE FUNCTION episode_search_vector_update();
