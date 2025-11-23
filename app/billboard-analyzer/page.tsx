'use client';

import React, { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Users, Lightbulb, Megaphone, Search, Navigation, X } from "lucide-react";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Map component that handles all dynamic imports
const BillboardMap = dynamic(() => import('./MapComponent'), { ssr: false });

// Types
interface BillboardIdea {
  category: string;
  why_it_works: string;
  example_message: string;
}

interface AnalysisResult {
  location_name: string;
  area_summary: string;
  audience_profile: string[];
  billboard_ideas: BillboardIdea[];
}

interface LocationData {
  lat: number;
  lng: number;
}

interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

// Gemini API Schema
const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    location_name: {
      type: SchemaType.STRING,
      description: "A refined name for this area (e.g., 'Times Square, NYC' or 'Rural Route 66').",
    },
    area_summary: {
      type: SchemaType.STRING,
      description: "A professional summary of the commercial and residential ambiance of the location.",
    },
    audience_profile: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "3-5 bullet points describing the key demographics.",
    },
    billboard_ideas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING, description: "Industry category" },
          why_it_works: { type: SchemaType.STRING, description: "Strategic reasoning." },
          example_message: { type: SchemaType.STRING, description: "Creative copy." },
        },
        required: ["category", "why_it_works", "example_message"],
      },
    },
  },
  required: ["location_name", "area_summary", "audience_profile", "billboard_ideas"],
};



export default function BillboardAnalyzerPage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOptions, setSearchOptions] = useState<readonly NominatimPlace[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Gemini API Call
  const fetchAnalysis = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found. Please check your environment configuration.");
      }

      const ai = new GoogleGenerativeAI(apiKey);
      const modelId = "gemini-2.5-flash";

      const prompt = `
        You are a world-class consultant in Out-of-Home (OOH) advertising and location strategy.
        Analyze the following geographic coordinates: Latitude ${lat}, Longitude ${lng}.

        Return a JSON object with exactly this structure:
        {
          "location_name": "A descriptive name for this location",
          "area_summary": "A detailed description of the environment and ambiance",
          "audience_profile": ["audience type 1", "audience type 2", "audience type 3"],
          "billboard_ideas": [
            {
              "category": "Advertising category",
              "why_it_works": "Why this works for this location",
              "example_message": "Sample billboard text"
            }
          ]
        }

        Provide 3-5 items in audience_profile and exactly 3 billboard_ideas.
        Return only valid JSON, no additional text.
      `;

      const model = ai.getGenerativeModel({
        model: modelId,
        generationConfig: {
          temperature: 0.5,
          responseMimeType: "application/json",
        }
      });

      const response = await model.generateContent(prompt);

      const responseText = response.response.text();
      if (responseText) {
        try {
          const data = JSON.parse(responseText) as Partial<AnalysisResult>;

          // Ensure all required fields exist with fallbacks
          const validatedData: AnalysisResult = {
            location_name: data.location_name || `Location at ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
            area_summary: data.area_summary || "Location analysis is being processed. Please try again.",
            audience_profile: Array.isArray(data.audience_profile) ? data.audience_profile : ["Audience data unavailable"],
            billboard_ideas: Array.isArray(data.billboard_ideas) ? data.billboard_ideas : [{
              category: "General Advertising",
              why_it_works: "Default advertising opportunity",
              example_message: "Your message here"
            }]
          };

          setAnalysis(validatedData);
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          throw new Error("Failed to parse analysis response.");
        }
      } else {
        throw new Error("No analysis generated.");
      }

    } catch (err) {
      console.error("Gemini Error:", err);
      setError("We couldn't analyze this specific location. Please try a nearby point.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle Location Selection
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setDrawerOpen(true);
    fetchAnalysis(lat, lng);
  }, [fetchAnalysis]);

  // Handle Search
  useEffect(() => {
    let active = true;

    if (searchQuery === '') {
      setSearchOptions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`);
        const data = await response.json();
        if (active) {
          setSearchOptions(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Geolocation on startup
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationSelect(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation access denied or failed.", err);
        }
      );
    }
  }, [handleLocationSelect]);

  // Manual location button
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        handleLocationSelect(position.coords.latitude, position.coords.longitude);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="h-screen bg-[#f4f1de] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-[#81b29a]/20 shadow-sm z-40 shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#e07a5f]/10 p-2 rounded-xl">
                <Megaphone className="h-5 w-5 text-[#e07a5f]" />
              </div>
              <h1 className="text-xl font-bold text-[#3d405b]">Billboard Analyzer</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#3d405b]/40" />
                <Input
                  placeholder="Search location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-10 h-10 bg-[#f4f1de]/50 border-[#81b29a]/30 focus:border-[#e07a5f] focus:ring-[#e07a5f]/20 rounded-full"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-[#e07a5f]" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchOptions.length > 0 && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#81b29a]/20 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  {searchOptions.map((option) => (
                    <button
                      key={option.place_id}
                      onClick={() => {
                        handleLocationSelect(parseFloat(option.lat), parseFloat(option.lon));
                        setSearchQuery("");
                        setSearchOptions([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#f4f1de]/50 border-b border-[#81b29a]/10 last:border-b-0 flex items-start gap-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <MapPin className="h-4 w-4 text-[#e07a5f] mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#3d405b] truncate">
                          {option.display_name.split(',')[0]}
                        </p>
                        <p className="text-xs text-[#3d405b]/60 truncate">
                          {option.display_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleLocateMe}
              className="bg-[#e07a5f] hover:bg-[#e07a5f]/90 text-white rounded-full px-5 h-10 gap-2 shadow-sm btn-lift shrink-0"
            >
              <Navigation className="h-4 w-4" />
              <span className="hidden md:inline">My Location</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Container */}
        <div className={`flex-1 relative transition-all duration-300 ${drawerOpen ? 'mr-0' : ''}`}>
          <BillboardMap
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            drawerOpen={drawerOpen}
          />

          {/* Floating Action Button - Only show when drawer is closed on mobile */}
          <Button
            onClick={handleLocateMe}
            className={`absolute bottom-6 right-6 h-14 w-14 rounded-full bg-white text-[#e07a5f] hover:bg-[#e07a5f] hover:text-white shadow-xl border border-[#81b29a]/20 transition-all duration-200 btn-lift ${drawerOpen ? 'lg:hidden' : ''}`}
            size="icon"
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div>

        {/* Analysis Drawer */}
        <div className={`fixed lg:relative right-0 top-[65px] lg:top-0 h-[calc(100vh-65px)] lg:h-full w-full lg:w-[420px] bg-white shadow-2xl lg:shadow-none border-l border-[#81b29a]/20 transform transition-transform duration-300 z-30 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#81b29a]/20 bg-linear-to-r from-[#f4f1de]/30 to-white">
            <h2 className="text-lg font-bold text-[#3d405b]">Analysis Results</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(false)}
              className="hover:bg-[#e07a5f]/10 hover:text-[#e07a5f] rounded-full h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-5 h-[calc(100%-57px)] overflow-y-auto custom-scrollbar">
            {/* Empty State */}
            {!selectedLocation && (
              <div className="text-center mt-20 animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-[#e07a5f]/20 to-[#f2cc8f]/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <MapPin className="h-12 w-12 text-[#e07a5f]" />
                </div>
                <h3 className="text-xl font-bold text-[#3d405b] mb-3">Select a Location</h3>
                <p className="text-[#3d405b]/60 max-w-xs mx-auto leading-relaxed">
                  Click anywhere on the map to discover audience insights and advertising opportunities.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 bg-[#e07a5f]/5 p-4 rounded-2xl">
                  <Loader2 className="h-5 w-5 animate-spin text-[#e07a5f]" />
                  <p className="text-[#3d405b] font-medium">Analyzing geospatial data...</p>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-gradient-to-r from-[#f4f1de]/50 to-[#81b29a]/10 rounded-2xl animate-pulse" />
                  <div className="h-6 bg-[#f4f1de]/50 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-[#f4f1de]/50 rounded-full animate-pulse" />
                  <div className="h-4 bg-[#f4f1de]/50 rounded-full w-5/6 animate-pulse" />
                  <div className="h-28 bg-gradient-to-r from-[#f4f1de]/50 to-[#81b29a]/10 rounded-2xl animate-pulse" />
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-5 mt-4 animate-fade-in">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 font-bold">!</span>
                    </div>
                  </div>
                  <p className="text-amber-800 text-sm leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {analysis && !isLoading && selectedLocation && (
              <div className="space-y-5 animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#e07a5f]/5 to-[#f2cc8f]/5 p-5 rounded-2xl border border-[#81b29a]/10">
                  <p className="text-[#81b29a] font-semibold text-xs uppercase tracking-wide mb-2">Location Insights</p>
                  <h3 className="text-2xl font-bold text-[#3d405b] mb-3 leading-tight">{analysis.location_name}</h3>
                  <Badge variant="outline" className="text-xs bg-white/50 border-[#81b29a]/30 text-[#3d405b]">
                    📍 {selectedLocation.lat.toFixed(3)}, {selectedLocation.lng.toFixed(3)}
                  </Badge>
                </div>

                {/* Area Profile */}
                <Card className="border-[#81b29a]/20 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 bg-gradient-to-r from-[#f4f1de]/30 to-white">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-[#81b29a]/10 rounded-lg">
                        <MapPin className="h-4 w-4 text-[#81b29a]" />
                      </div>
                      <span className="text-[#3d405b] font-bold">Area Profile</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-[#3d405b]/80 leading-relaxed text-sm">{analysis.area_summary}</p>
                  </CardContent>
                </Card>

                {/* Audience Persona */}
                <Card className="border-[#81b29a]/20 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 bg-gradient-to-r from-[#f4f1de]/30 to-white">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-[#e07a5f]/10 rounded-lg">
                        <Users className="h-4 w-4 text-[#e07a5f]" />
                      </div>
                      <span className="text-[#3d405b] font-bold">Audience Persona</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-2">
                      {analysis.audience_profile?.map((item, idx) => (
                        <Badge key={idx} className="bg-[#e07a5f]/10 text-[#e07a5f] border-[#e07a5f]/20 hover:bg-[#e07a5f]/20 transition-colors px-3 py-1 text-xs font-medium">
                          {item}
                        </Badge>
                      )) || <span className="text-[#3d405b]/50 text-sm">No audience data available</span>}
                    </div>
                  </CardContent>
                </Card>

                {/* Strategic Opportunities */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-[#f2cc8f]/20 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-[#e07a5f]" />
                    </div>
                    <h4 className="text-base font-bold text-[#3d405b]">Strategic Opportunities</h4>
                  </div>

                  <div className="space-y-3">
                    {analysis.billboard_ideas?.map((idea, idx) => (
                      <Card key={idx} className="border-l-4 border-l-[#f2cc8f] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
                        <CardContent className="pt-5 pb-5">
                          <Badge className="mb-3 bg-[#f2cc8f]/20 text-[#e07a5f] border-[#f2cc8f]/50 hover:bg-[#f2cc8f]/30 px-3 py-1 text-xs font-semibold">
                            {idea.category}
                          </Badge>

                          <p className="text-[#3d405b]/80 mb-4 leading-relaxed text-sm">{idea.why_it_works}</p>

                          <div className="bg-gradient-to-br from-[#f4f1de] to-[#f2cc8f]/10 p-4 rounded-xl border border-[#f2cc8f]/30">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <Megaphone className="h-4 w-4 text-[#e07a5f]" />
                              </div>
                              <p className="text-[#3d405b] font-semibold italic text-sm leading-relaxed">
                                &ldquo;{idea.example_message}&rdquo;
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
